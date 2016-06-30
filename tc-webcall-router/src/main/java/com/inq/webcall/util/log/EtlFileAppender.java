package com.inq.webcall.util.log;

import org.apache.log4j.FileAppender;
import org.apache.log4j.helpers.LogLog;
import org.apache.log4j.spi.LoggingEvent;

import java.io.File;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Locale;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Created by dlee on 6/30/2016.
 */
public class EtlFileAppender extends FileAppender implements Runnable {
    // ----------------------------------------------------- Instance Variables

    /**
     * The directory in which log files are created.
     * Wihtout a leading slash, this is relative to the Tomcat home directory.
     */
    private String m_directory = "logs";

    /**
     * The prefix that is added to log file filenames.
     */
    private String m_prefix = "tomcat.";

    /**
     * The suffix that is added to log file filenames.
     */
    private String m_suffix = ".log";

    /**
     * The File representation of the directory in which log files are created.
     */
    private File m_path = null;
    private String rollDirectoryPath;

    private static volatile int failedFileMoveOperations = 0; // We don't need strong synchronization on this, it's used only to detect failures in tests

    /**
     * A calendar object for manipulating dates and times.
     */
    private Calendar m_calendar = null;

    private boolean areOptionsInitialized = false;

    /**
     * The number of milliseconds since 1/1/1970 when nextTime starts (local time).
     */
    private long whenToCreateNewLogFile = 0L;
    private AtomicInteger rolloverInterval = new AtomicInteger(5); // in minutes
    private volatile boolean hasRecordsInCurrentFile = false;
    private Thread unlockerThread = null;

    private SimpleDateFormat datestampFormat = new SimpleDateFormat("yyyy-MM-dd-HHmm", Locale.ENGLISH);
    public static final String UNLOCKER_THREAD_NAME_PREFIX = "ETL-unlockerThread.";

    // ----------------------------------------------------------- Constructors

    /**
     * The default constructor will create a Tomcat FileLogger
     * with the following characteristics:
     * <ul>
     * <li>directory: "logs"</li>
     * <li>prefix: "tomcat."</li>
     * <li>suffix: ".log"</li>
     * </ul>
     */
    public EtlFileAppender() {
    }

    // ------------------------------------------------------------- Properties

    /**
     * @return the directory in which we create log files.
     */
    public String getDirectory() {
        return m_directory;
    }

    /**
     * Set the directory in which we create log files.
     *
     * @param directory The new log file directory
     */
    public void setDirectory(String directory) {
        m_directory = directory;
    }

    /**
     * @return the log file prefix.
     */
    public String getPrefix() {
        return m_prefix;
    }

    /**
     * Set the log file prefix.
     *
     * @param prefix The new log file prefix
     */
    public void setPrefix(String prefix) {
        m_prefix = prefix;
    }

    /**
     * @return the log file suffix.
     */
    public String getSuffix() {
        return m_suffix;
    }

    /**
     * Set the log file suffix.
     *
     * @param suffix The new log file suffix
     */
    public void setSuffix(String suffix) {
        m_suffix = suffix;
    }

    // --------------------------------------------------------- Public Methods


    /**
     * Called once all options have been set on this Appender.
     */
    public void activateOptions() {
        areOptionsInitialized = false;
        hasRecordsInCurrentFile = false;
        if (m_prefix == null) {
            m_prefix = "";
        }
        if (m_suffix == null) {
            m_suffix = "";
        }
        if(this.rollDirectoryPath != null) {
            ensureRollDirectoryExists();
        }
        if ((m_directory == null) || (m_directory.length() == 0)) {
            m_directory = ".";
        }

        m_path = getAbsoluteLogDirectory();
        if (!m_path.exists() && !m_path.mkdirs()) {
            LogLog.error("Failed to create log directory: " + m_path.getAbsolutePath());
        }
        if (m_path.canWrite()) {
            m_calendar = Calendar.getInstance();
            areOptionsInitialized = true;
        }
    }

    protected File getAbsoluteLogDirectory() {
        File path = new File(m_directory);
        if (!path.isAbsolute()) {
            String base = System.getProperty("catalina.base");
            if (base != null) {
                path = new File(base, m_directory);
            }
        }
        return path;
    }

    /**
     * Called by AppenderSkeleton.doAppend() to write a log message formatted
     * according to the layout defined for this appender.
     * Externally synchronized by log4j.
     */
    public void append(LoggingEvent event) {
        if (this.layout == null) {
            LogLog.error("No layout set for the appender named [" + name + "].");
            return;
        }
        if (!areOptionsInitialized) {
            LogLog.error("Improper initialization for the appender named [" + name + "].");
            return;
        }
        synchronized (this) {
            final long now = System.currentTimeMillis();
            if (hasNextTimeCome(now)) {
                activateNextLogFile(now); // updates hasRecordsInCurrentFile and whenToCreateNewLogFile
            }
            if (unlockerThread == null) {
                // the very first record is logged, hasRecordsInCurrentFile is false
                startUnlockerDaemon();
            }
            if (this.qw == null) { // should never happen
                LogLog.error("No output stream or file set for the appender named [" + name + "].");
                return;
            }
            subAppend(event);
            hasRecordsInCurrentFile = true;
        }
    }

    private String generateLogFileName(long currentTimeMillis) {
        m_calendar.setTimeInMillis(currentTimeMillis);
        String newFilename = m_prefix + datestamp(m_calendar) + m_suffix;
        return new File(m_path, newFilename).getAbsolutePath();
    }

    /**
     * Starts logging to new log file, which name is based on the currentTimeMillis parameter.
     * Calls must be synchronized on "this".
     * @param currentTimeMillis current time
     */
    private void activateNextLogFile(long currentTimeMillis) {
        File oldFile = this.fileName == null ? null : new File(this.fileName);
        whenToCreateNewLogFile = getNextTime(currentTimeMillis);

        // update the FileAppender.fileName field
        fileName = generateLogFileName(currentTimeMillis);

        // close current file and open new file
        super.activateOptions();

        if (oldFile != null) {
            moveToRollDirectory(oldFile, hasRecordsInCurrentFile);
        }
        hasRecordsInCurrentFile = false;
    }

    protected void ensureRollDirectoryExists() {
        File rollPath = new File(this.rollDirectoryPath);
        if(!rollPath.exists()) {
            if (rollPath.mkdirs()) {
                LogLog.debug("Created rollover directory: " + rollPath.getAbsolutePath());
            } else {
                LogLog.error("Failed to create rollover directory: " + rollPath.getAbsolutePath());
            }
        }
    }

    private String toAbsolutePath(String path) {
        File rollPath = new File(path);
        return rollPath.getAbsolutePath();
    }

    private void moveToRollDirectory(File oldFile, boolean hasRecordsInCurrentFile) {
        if (this.rollDirectoryPath != null && oldFile.isFile()) {
            if (hasRecordsInCurrentFile) { // i.e. oldFile.length() != 0
                final File newFile = new File(toAbsolutePath(this.rollDirectoryPath), oldFile.getName());
                if (!oldFile.renameTo(newFile)) {
                    ++failedFileMoveOperations;
                    LogLog.error(String.format("moveToRollDirectory(): Failed to move the file from %s to %s", oldFile.getAbsolutePath(), newFile.getAbsolutePath()));
                }
            } else {
                // delete empty file
                if (!oldFile.delete()) {
                    ++failedFileMoveOperations;
                    LogLog.error("moveToRollDirectory(): Failed to delete empty log file: " + oldFile.getName());
                }
            }
        }
    }

    /**
     * Formats a datestamp as yyyy-MM-DD-HHmm using a Calendar source object.
     *
     * @param calendar a Calendar containing the date to format.
     * @return a String in the form "yyyy-MM-DD-HHmm".
     */
    public String datestamp(Calendar calendar) {
        return datestampFormat.format(calendar.getTime());
    }

    /**
     * Sets a calendar to the start of nextTime,
     * with all time values reset to zero.
     * <p/>
     * <p>Takes advantage of the fact that the Java Calendar implementations
     * are mercifully accommodating in handling non-existent dates. For example,
     * June 31 is understood to mean July 1. This allows you to simply add one
     * to today's day of the month to generate nextTime's date. It also works
     * for years, so that December 32, 2004 is converted into January 1, 2005.</p>
     *
     * @param currentTimeMillis current time
     * @return time to create new log file
     */
    public long getNextTime(long currentTimeMillis) {
        m_calendar.setTimeInMillis(currentTimeMillis);
        int year = m_calendar.get(Calendar.YEAR);
        int month = m_calendar.get(Calendar.MONTH);
        int day = m_calendar.get(Calendar.DAY_OF_MONTH);
        int hour = m_calendar.get(Calendar.HOUR_OF_DAY);
        int minute = m_calendar.get(Calendar.MINUTE) + rolloverInterval.get();
        m_calendar.clear();
        m_calendar.set(year, month, day, hour, minute);
        return m_calendar.getTimeInMillis();
    }

    public void setRolloverInterval(int intervalInMin) {
        rolloverInterval.set(intervalInMin);
    }

    public void setRollDirectoryDestinationPath(String rollDirectoryPath) {
        this.rollDirectoryPath = rollDirectoryPath;
    }

    public static int getFailedFileMoveOperations() {
        return failedFileMoveOperations;
    }

    private void startUnlockerDaemon() {
        unlockerThread = new Thread(this, UNLOCKER_THREAD_NAME_PREFIX + m_prefix);
        unlockerThread.start();
    }

    @Override
    public void run() {
        try {
            while(true) {
                long timeToSleep;
                if (hasRecordsInCurrentFile) {
                    final long now;
                    synchronized (this) {
                        now = System.currentTimeMillis();
                        if (hasNextTimeCome(now)) {
                            // to unlock the current log file (so that etl-start.sh will process it) we switch to a new log.
                            activateNextLogFile(now); // updates hasRecordsInCurrentFile and whenToCreateNewLogFile
                        }
                    }
                    timeToSleep = whenToCreateNewLogFile - now;
                } else {
                    final long now = System.currentTimeMillis();
                    timeToSleep = getNextTime(now) - now;
                }
                if (unlockerThread.isInterrupted()) {
                    break;
                }
                Thread.sleep(timeToSleep);
            }
        } catch (InterruptedException e) { // happens when stopThreads() has been executed.
            unlockerThread = null;
        }
    }

    private boolean hasNextTimeCome(long now) {
        return now >= whenToCreateNewLogFile;
    }

}

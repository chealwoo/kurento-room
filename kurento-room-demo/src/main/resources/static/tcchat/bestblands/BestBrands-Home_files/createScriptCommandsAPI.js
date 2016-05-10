/**
 * v 1.0, Updated 7/23/2014
 */

inQ.requirejQuery();

inQ.addOns.createScriptCommandsAPI = function() {
	inQ.console('createScriptCommandsAPI');
	inQ.commands = {event: Inq.fireCustomEvent};
	inQ.deferredCommands = {};
	inQ.registerCommand = function(name, fn) {
		inQ.commands[name] = fn;
		var deferred = inQ.deferredCommands[name];
		if (deferred) {
			if (fn.skipToLast) {
				executeCommand(deferred[deferred.length - 1]);
			} else {
				for (var i, l = deferred.length; i < l; i++) {
					executeCommand(deferred[0]);
					deferred.shift();
				}
			}
			inQ.deferredCommands[name] = [];
		}
	};
	
	function getContext() {
		var context = (document.getElementById('tcChat_Skin')) ? 'top' : 'iframe';
		return {
			frame: context,
			ns: context === 'top' ? 'tcChat_' : '', // namespace
			root: context === 'top' ? document.getElementById('tcChat_Skin') : top.inqFrame.document
		};
	}
	
	var evalTimer = 0;
		
	inQ.addOns.findScriptCommands = function() {
		inQ.console('finding Script Commands!');
		var context = getContext(),
			$commands = inQ.$('#' + context.ns + 'chatWindow .agentMsg', context.root).filter(function() {
				var match = this.textContent.match(/(.*){{(.*)}}/);
				if (!match) {return;}
				var command = '<span class="inqScriptCommand" style="display:none;">' + match[2] + '</span>',
					agentText = match[1].trim(),
					agentTextHtml = '<span class="inqAgentText">' + agentText + '</span>',
					$tr = inQ.$(this).closest('tr').addClass('inqAgentScriptCommand');
				inQ.$(this).html(agentTextHtml + command);
				if (agentText.match(/^\|\|/)) {$tr.hide();} // scripts starting with double pipes (||) will be entirely hidden
				return true;
			});
		
		clearTimeout(evalTimer);
		if (! $commands.length) {return;}
		evalTimer = setTimeout(processLastScriptCommand, 100);
	};
	
	
	function processLastScriptCommand() {
		var context = getContext(),
			$commands = inQ.$('.inqScriptCommand', context.root),
			$chatLines = $commands.last().closest('#' + context.ns + 'chatWindow').find('.agentMsg, .customerMsg'),
			command = $commands.last().text(),
			lastCommand = sessionStorage.getItem('inqLastCommand'),
			commandName = command.replace(/\(.*/, ''),
			commandFn = inQ.commands[commandName];
			
		if (! $commands.last().closest('.agentMsg').is($chatLines.last())) {return;}
		
		if (commandFn) {
			executeCommand(command);
		} else {
			inQ.deferredCommands[commandName] = inQ.deferredCommands[commandName] || [];
			inQ.deferredCommands[commandName].push(command);
		}
	}
	
	function executeCommand(command) {
		var lastCommand = sessionStorage.getItem('inqLastCommand'),
			commandName = command.replace(/\(.*/, ''),
			commandFn = inQ.commands[commandName];
		
		if (lastCommand === command && !commandFn.repeatOnRender) {return;}
		
		inQ.console('executing command: ' + command);
		sessionStorage.setItem('inqLastCommand', command);
		eval('top.inQ.commands.' + command);
	}
	
	inQ.addOns.resetScriptCommandsListener = function() {
		sessionStorage.removeItem('inqLastCommand');
	};
};

inQ.addOns.createScriptCommandsAPI();
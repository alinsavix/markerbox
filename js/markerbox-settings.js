/*

This file contains Javascript for the main Markerbox panel in Adobe Premiere Pro. It is loaded by markerbox-panel.html

© 2021 by Tyron Montgomery
Last modified on April 14, 2021

 You should only change the following code if you really know what you are doing!
 Absolutely no documentation, help or support is available for Markerbox code (apart from the inline comments below).
 In case you just want to tweak some settings I recommend using the Markerbox settings panel in Premiere Pro instead.

*/



			var standardStatus = "";
			var userDataPath = "";
			var markerboxDataPath = "";
			var defaultSettingsFilename = "";
			var customSettingsFilename = "";
			var importedSettings = "";
			var importedDefault = "";
			var SETTINGS = "";
		
            function load_settings()
                {
				// Attempt to open custom and default settings.
				var readResult = window.cep.fs.readFile(customSettingsFilename);
				var readCustomError = readResult.err;
				if(readCustomError == 0)
					{
					importedSettings = readResult.data;
					editor.value = readResult.data;
					}
				readResult = window.cep.fs.readFile(defaultSettingsFilename);
				var readDefaultError = readResult.err;
				if(readDefaultError == 0)
					{
					importedDefault = readResult.data;
					if(readCustomError != 0 || importedSettings == "")
						{
						importedSettings = readResult.data;
						editor.value = readResult.data;
						}
					}

				// If no custom settings exist save the default settings as custom settings
				if((readCustomError == 2 || readCustomError == 3) && readDefaultError == 0) 
					{
					if(!window.cep.fs.stat(markerboxDataPath).data.isDirectory()) window.cep.fs.makedir(markerboxDataPath);
					window.cep.fs.writeFile(customSettingsFilename, editor.value);
					readResult = window.cep.fs.readFile(customSettingsFilename);
					readCustomError = readResult.err;
					}

				// Error reporting
				if(readCustomError == 0 && readDefaultError == 0) return true;
				
				var msg = "";
				if(readCustomError != 0 && readDefaultError != 0) msg = "No settings loaded!\n\n";
				else if(readCustomError != 0 && readDefaultError == 0) msg = "Only default settings loaded.\n\n";
				else if(readCustomError == 0 && readDefaultError != 0) msg = "Only custom settings loaded!\n\n";
				// Keep the last if statement in here in case we have more operations in the future

				if(readCustomError == 2 || readCustomError == 3) msg += "Markerbox could not create a custom settings file for you. This is rather unusual. If you cannot save the settings please get in touch with the Markerbox support.\n\n";
				else if (readCustomError == 5) msg += "Your operating system denied the access to the custom settings file (error 5).\n\n";
				else if (readCustomError == 30) msg += "There was an error reading the custom settings file (error 30).\n\n";
				else if (readCustomError == 32 || readCustomError == 33) msg += "Markerbox cannot access the custom settings file because it is open in another program (error 32/33).\n\n";
				else msg += "Markerbox cannot read the settings file (error " + readCustomError + ").\n\n";

				if(readDefaultError == 2 || readDefaultError == 3) msg += "Default settings file not found. Please reinstall Markerbox. The default settings file default-settings.js should be in the folder markerbox/js.";
				else if (readDefaultError == 5) msg += "Your operating system denied the access to the default settings file (error 5). It will not be possible to reset your custom settings to the default settings.";
				else if (readDefaultError == 30) msg += "There was an error reading the default settings file (error 30). It will not be possible to reset your custom settings to the default settings. If this error appears again reinstalling Markerbox may solve the problem.";
				else if (readDefaultError == 32 || readDefaultError == 33) msg += "Markerbox cannot access the default settings file because it is open in another program (error 32/33). It will not be possible to reset your custom settings to the default settings.";
				else msg += "Markerbox cannot read the default settings file (error " + readDefaultError + "). If this error appears again reinstalling Markerbox may solve the problem.";

				alertbox(msg, "ERROR", true);
				}

			function reset_settings()
				{
				if(importedSettings != "") editor.value = importedSettings;
				}

			function reset_to_default()
				{
				// Add a confirm box to this!!!
				if(importedDefault != "")
					{
					editor.value = importedDefault;
					importedSettings = importedDefault;
					}
				else
					{
					// In case the settings couldn't be loaded the first time try again
					readResult = window.cep.fs.readFile(defaultSettingsFilename);
					var e = readResult.err;
					if(e != 0)
						{
						if (e == 2 || e == 3) editor.value = "The Markerbox default settings file could not be found (error 2/3).";
						else if (e == 5) editor.value = "Your operating system denied the access to the Markerbox default settings file (error 5).";
						else if (e == 30) editor.value = "There was an error reading the Markerbox default settings file (error 30).";
						else if (e == 32 || e == 33) editor.value = "Markerbox cannot access the default settings file because it is open in another program (error 32/33).";
						else editor.value = "Markerbox cannot read the default settings file (error " + e + ").";
						return;
						}
					// Load the settings into the panel
					importedSettings = readResult.data;
					editor.value = readResult.data;
					}
				//save_settings();
				var writeResult = window.cep.fs.writeFile(customSettingsFilename, editor.value);
				e = writeResult.err;
				if(e == 0) alertbox("Your settings were reset to default values and saved successfully.", "MARKERBOX", false);
				else alertbox("Sorry, your settings could not be saved (write error " + e + ").", "ERROR", true);
				}

			function save_settings()
				{
				var result;
				// Does the Markerbox folder exist already exist? If not create it.
				if(!window.cep.fs.stat(markerboxDataPath).data.isDirectory())
					{
					result = window.cep.fs.makedir(markerboxDataPath);
					if(result.err != 0)
						{
						alertbox("The Markerbox settings folder doesn't exist and cannot be created (error " + result.err + ").", "ERROR", true);
						return false;
						}
					}

				// Check the filename
				if(customSettingsFilename == "")
					{
					alertbox("Markerbox cannot determine the name of the settings file. This is a very unusual error. Please get in touch: http://markerbox.pro/contact", "ERROR", true);
					return false;
					}

				// Check for Javascript errors in the settings
				SETTINGS = "not ok";
				setTimeout(save_settings_2, 500);
				SETTINGS = eval(editor.value);
				// Explanation: Eval may cause the function to crash. So we start eval here and pick up the result in save_settings_2()
				}

			function save_settings_2()
				{
				var e = settings_error();
				if(e != "none")
					{
					alertbox("Error in the settings (error code " + e + "). Please check your syntax or reset the settings to the previous version.", "ERROR", true);
					// elaborate this, based on the error codes
					return false;
					}
				var writeResult = window.cep.fs.writeFile(customSettingsFilename, editor.value);
				e = writeResult.err;
				if(e == 0)
					{
					alertbox("Your settings were saved successfully.", "MARKERBOX", false);
					importedSettings = editor.value;
					}
				else alertbox("Sorry, your settings could not be saved (write error " + e + ").", "ERROR", true);
				}

			function activate_default()
				{
				resetToDefault.onclick = function(e)
					{
					e.preventDefault(); 
					reset_to_default();
					};
				resetToDefault.className = "orange";
				resetToDefault.style.cursor = "pointer";
				}

			function deactivate_default()
				{
				resetToDefault.onclick = function(e) {};
				resetToDefault.className = "";
				resetToDefault.style.cursor = "default";
				}

			function activate_reset()
				{
				resetSettingsonclick = function(e)
					{
					e.preventDefault(); 
					reset_settings();
					};
				resetSettings.className = "orange";
				resetSettings.style.cursor = "pointer";
				}

			function deactivate_reset()
				{
				resetSettings.onlick = function(e) {};
				resetSettings.className = "";
				resetSettings.style.cursor = "default";
				}

			function activate_save()
				{
				saveSettings.onclick = function(e)
					{
					e.preventDefault(); 
					reset_settings();
					};
				saveSettings.className = "blue";
				saveSettings.style.cursor = "pointer";
				}

			function deactivate_save()
				{
				saveSettings.onclick = function(e) {};
				saveSettings.className = "";
				saveSettings.style.cursor = "default";
				}

			function update_interface()
				{
				// Doesn't seem to work. Cannot find the reason. Not crucial. Deactivated for the moment.
				return;
				if(customSettingsFilename == "" || importedSettings == editor.value) deactivate_save();
				else activate_save();

				if(importedSettings == editor.value) deactivate_reset();
				else activate_reset();

				if(defaultSettingsFilename == "" || importedDefault == editor.value) deactivate_default();
				else activate_default();
				}


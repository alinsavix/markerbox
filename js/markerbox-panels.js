/*

This file contains Javascript used by all Markerbox panels in Adobe Premiere Pro.

© 2021 by Tyron Montgomery
Last modified on April 14, 2021

 You should only change the following code if you really know what you are doing!
 Absolutely no documentation, help or support is available for Markerbox code (apart from the inline comments below).
 In case you just want to tweak some settings I recommend using the Markerbox settings panel in Premiere Pro instead.

*/



function error_log(str,suffix)
	{
	return;
	var errFile = new CSInterface().getSystemPath(SystemPath.USER_DATA) + "/Markerbox/error-output." + suffix;
	window.cep.fs.writeFile(errFile, str);
	}

debug_log = function(ev="", s1="", s2="")
	{
	if(ev == "") return;
	var pixSrc = "./html/markerbox-debug.html";
	pixSrc += "#####ev=" + encodeURIComponent(ev);
	if(s1 != "") pixSrc += "#####s1=" + encodeURIComponent(s1);
	if(s2 != "") pixSrc += "#####s2=" + encodeURIComponent(s2);
	statuspixel.src = pixSrc; 
	}

function alertbox(strText, strTitle, boolIcon)
	{
	var parameters = [strText, strTitle, boolIcon];
	var jsonData = JSON.stringify(parameters);
	new CSInterface().evalScript("$.markerboxPanel.alertbox(" + jsonData + ")");
	}



function default_settings_filename()
	{
	return new CSInterface().getSystemPath(SystemPath.EXTENSION) + "/js/default-settings.js";
    }



function custom_settings_filename()
	{
	return new CSInterface().getSystemPath(SystemPath.USER_DATA) + "/Markerbox/custom-settings.js";
    }



function user_data_path()
	{
	return new CSInterface().getSystemPath(SystemPath.USER_DATA);
    }



function settings_error()
	{
	var markerTypes = " Comment Chapter Segmentation WebLink ";
	var markerColors = " 0 1 2 3 4 5 6 7 ";
	var markerModes = " 0 1 2 ";
	var i;

	if(SETTINGS == "not ok" || SETTINGS != "ok") return "101";

	if(typeof(PREF_SCREENLIGHT_MARKER_COLOR) != "number") return "210a";
	if(markerColors.indexOf(String(PREF_SCREENLIGHT_MARKER_COLOR)) == -1) return "210b";

	if(typeof(PREF_SCREENLIGHT_MARKER_TYPE) != "string") return "220a";
	if(markerTypes.indexOf(String(PREF_SCREENLIGHT_MARKER_TYPE)) == -1) return "220b";

	if(typeof(PREF_SCREENLIGHT_MULTICOLOR_MODE) != "number") return "230a";
	if(markerModes.indexOf(String(PREF_SCREENLIGHT_MULTICOLOR_MODE)) == -1) return "230b";

	if(typeof(PREF_SCREENLIGHT_AUTOCOLOR_ORDER) != "object") return "240a";
	if(!Array.isArray(PREF_SCREENLIGHT_AUTOCOLOR_ORDER)) return "240b";
	for(i=0; i<PREF_SCREENLIGHT_AUTOCOLOR_ORDER.length; i++)
		{
		if(typeof(PREF_SCREENLIGHT_AUTOCOLOR_ORDER[i]) != "number") return "240c" + i;
		else if(markerColors.indexOf(String(PREF_SCREENLIGHT_AUTOCOLOR_ORDER[i])) == -1) return "240d" + i;
		}

	// Check the multicolor rules here (PREF_SCREENLIGHT_MULTICOLOR_RULES, error 250). 

	if(typeof(PREF_SEQUOIA_IMPORT_TRACK) != "number") return "310a";
	
	if(typeof(PREF_SEQUOIA_MARKER_COLOR) != "number") return "320a";
	if(markerColors.indexOf(String(PREF_SEQUOIA_MARKER_COLOR)) == -1) return "320b";

	if(typeof(PREF_SEQUOIA_MARKER_TYPE) != "string") return "330a";
	if(markerTypes.indexOf(String(PREF_SEQUOIA_MARKER_TYPE)) == -1) return "330b";

	if(typeof(PREF_SEQUOIA_MULTICOLOR_MODE) != "number") return "340a";
	if(markerModes.indexOf(String(PREF_SEQUOIA_MULTICOLOR_MODE)) == -1) return "340b";

	if(typeof(PREF_SEQUOIA_AUTOCOLOR_ORDER) != "object") return "350a";
	if(!Array.isArray(PREF_SEQUOIA_AUTOCOLOR_ORDER)) return "350b";
	for(i=0; i<PREF_SEQUOIA_AUTOCOLOR_ORDER.length; i++)
		{
		if(typeof(PREF_SEQUOIA_AUTOCOLOR_ORDER[i]) != "number") return "350c" + i;
		else if(markerColors.indexOf(String(PREF_SEQUOIA_AUTOCOLOR_ORDER[i])) == -1) return "350d" + i;
		}

	// Check the multicolor rules here (PREF_SEQUOIA_MULTICOLOR_RULES, error 360). 

	return "none";
	}

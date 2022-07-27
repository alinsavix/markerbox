/*

This file contains Javascript for the main Markerbox panel in Adobe Premiere Pro. It is loaded by markerbox-panel.html

© 2021 by Tyron Montgomery
Last modified on April 14, 2021

 You should only change the following code if you really know what you are doing!
 Absolutely no documentation, help or support is available for Markerbox code (apart from the inline comments below).
 In case you just want to tweak some settings I recommend using the Markerbox settings panel in Premiere Pro instead.

*/


var data;
var dropzoneBackup = "";
var dropzoneStr = "";
var dropzoneDelimiter = "";
var dropzoneArray = [];
var standardStatus = "";
var activeSequenceTimecodeFormat = "";
var sourceProgram = "";
var SETTINGS = "";



//---------- MAIN FUNCTIONS ----------



// Master functions
// Called by the buttons in index.html



function toggle_settings()
	{
	window.__adobe_cep__.requestOpenExtension("markerboxSettings","");

	// In case the settings window is already open the following CSEvent will make it close
	// (There's an event listener in the settings window)
	var event = new CSEvent("markerbox.settings.toggle", "APPLICATION");
	new CSInterface().dispatchEvent(event);
	}



function delete_all_sequence_markers()
	{
	set_status("Deleting markers ...","loader");
	new CSInterface().evalScript("$.markerboxPanel.delete_all_sequence_markers()", function(response)
		{
		set_status();
		});
	}



function import_markers(progName)
	{
	// Save the name of the source program in a global variable
	sourceProgram = progName;
	// All functions are based on an active sequence, and some need the sequence timecode format. So check this first.
	new CSInterface().evalScript("$.markerboxPanel.get_sequence_timecode_format()", function(response)
		{
		// Because this is an async call we use the response function to continue
		if (response != "error") import_markers_2(response);
		});
	}

function import_markers_2(response)
	{
	// Save the timecode format in a global variable
	activeSequenceTimecodeFormat = response;

	// Now we must load the settings again, because they might have been changed in the meantime.
	var js = load_settings();

	// Run the settings code via eval and check for errors in it
	SETTINGS = "not ok";
	setTimeout(import_markers_3, 500);
	SETTINGS = eval(js);
	// Explanation: Eval may cause the function to crash. So we start eval here and pick up the result in import_markers_3(), 500ms later.
	}

function import_markers_3()
	{
	var i, ii;
	try
		{
		var csvData, csvFilename, dialogResult, readResult;
		var csi = new CSInterface();

		// Check the validity of all settings variables in case there is an error in the code
		var err = settings_error();
		if(err != "none") throw { type: "settings", code: err };

		// Get the CSV filename (dialog box)
		if(SETTINGS_MAC_ERROR3 == 1)
			{
			readResult = null;
			// Try to read the file from document folder
			csvFilename = csi.getSystemPath(SystemPath.MY_DOCUMENTS) + "/import.csv";
			if(window.cep.fs.stat(csvFilename).err == 0)  readResult = window.cep.fs.readFile(csvFilename);
			if (readResult == null || readResult.err != 0)
				{
				csvFilename = csi.getSystemPath(SystemPath.MY_DOCUMENTS) + "/../Desktop/import.csv";
				if(window.cep.fs.stat(csvFilename).err == 0)  readResult = window.cep.fs.readFile(csvFilename);
				if (readResult == null || readResult.err != 0)
					{
					csvFilename = csi.getSystemPath(SystemPath.USER_DATA) + "/import.csv";
	    			if(window.cep.fs.stat(csvFilename).err == 0) readResult = window.cep.fs.readFile(csvFilename);
					if (readResult == null || readResult.err != 0)
						{
						csvFilename = csi.getSystemPath(SystemPath.EXTENSION) + "/import.csv";
	    				if(window.cep.fs.stat(csvFilename).err == 0) readResult = window.cep.fs.readFile(csvFilename);
						if (readResult == null || readResult.err != 0)
							{
							throw "Cannot find the file import.csv in your documents or the Markerbox folders.\n\nReminder: You are running Markerbox in the \"Error3 Work-Around Mode\". To change this open your settings and scroll to the bottom.";
							}
						}
					}
				}
			}
		else if(sourceProgram == "Dropzone") fileContent = dropzone.value;
        else if(sourceProgram == "Dropzone_Clip") fileContent = dropzone.value;
		else
			{
			dialogResult = window.cep.fs.showOpenDialog(false, false, "Import markers from file", "", ["csv", "tsv", "tab", "txt"]);
			if (dialogResult.data instanceof Array && dialogResult.data.length == 1)
				{
				csvFilename = dialogResult.data[0];
				// Fix escaped filenames and file:// or file:/// at the beginning
				if(navigator.userAgent.toLowerCase().indexOf("win") > 0)
					{
					if(csvFilename.toLowerCase().indexOf("%20") > 0 || csvFilename.toLowerCase().indexOf("%2f") > 0) csvFilename = decodeURIComponent(csvFilename);
					csvFilename = csvFilename.replace(/^file:\/{3}/,"");
					}
				else
					{
					csvFilename = csvFilename.replace(/^file:\/{2}/,"");
					if(csvFilename.indexOf(" ") == -1 && csvFilename.indexOf("/") == -1) csvFilename = decodeURIComponent(csvFilename);
					csvFilename = csvFilename.replace(/^file:\/{2}/,"");
					}
				//alertbox(csvFilename, "MARKERBOX DEVELOPMENT", false);
				debug_log("openfile", dialogResult.data[0], csvFilename);
				}
			else
				{
				//alertbox("Dialog length: " + dialogResult.data.length, "MARKERBOX DEVELOPMENT", true);
				throw { type: "cancel" };
				}
			}

		if(sourceProgram != "Dropzone" && sourceProgram != "Dropzone_Clip")
			{
			// Read the file content
			readResult = window.cep.fs.readFile(csvFilename);
			if (readResult.err == 0) fileContent = readResult.data;
			else throw { type: "fileread", code: readResult.err, fileName: csvFilename };

			// Fix Premiere's UTF-16LE CSV format.
			//Must be done here because of the following line endings clean-up.
			if(sourceProgram == "Premiere") fileContent = decodeURIComponent(encodeURIComponent(fileContent).replace(/%00/g,"").replace(/%EF%BF%BD/g,"*"));
			// This fix is not pleasing. Special characters like ä ö ü ß are not preserved.
			// We must still find out how we can import the CSV file "properly"
			// or how we can convert UTF-16LE to UTF-8 (no luck on the Internet so far).
			}

		// Unify line endings and delete empty lines to make all following scripts simpler
		fileContent = fileContent.replace(/\r\n/gi, '\n');	// the usual bugger
		fileContent = fileContent.replace(/\n\r/gi, "\n");	// just to make sure
		fileContent = fileContent.replace(/\r/gi, "\n");	// really old Mac format
		fileContent = fileContent.replace(/\f/gi, "\n");	// next page, just to make sure
		fileContent = fileContent.replace(/\n+/gi, "\n");	// multiple \n = empty lines
		fileContent = fileContent.replace(/^\n+/i, "");		// empty lines at the beginning

		// Clean dropzone content
		if(sourceProgram == "Dropzone" || sourceProgram == "Dropzone_Clip")
			{
			fileContent = clean_dropzone_input(fileContent);
			if(dropzoneDelimiter == "") dropzoneDelimiter = "\t";
			dropzone.value = fileContent;
			}

		// Parse the file content
		if(sourceProgram == "Screenlight") csvData = import_screenlight(fileContent);
		else if(sourceProgram == "Sequoia") csvData = import_sequoia(fileContent);
		else if(sourceProgram == "Reaper") csvData = import_reaper(fileContent);
		else if(sourceProgram == "Premiere") csvData = import_premiere(fileContent);
		else if(sourceProgram == "Dropzone") csvData = import_dropzone(fileContent);
        else if(sourceProgram == "Dropzone_Clip") csvData = import_dropzone(fileContent);
		else if(sourceProgram == "Vimeo") csvData = import_vimeo(fileContent);
		// Create markers on timeline
		set_status("Adding " + csvData.times.length + " markers ...","loader");
		var jsonData = JSON.stringify(csvData);

        if (sourceProgram == "Dropzone_Clip") {
            csi.evalScript("$.markerboxPanel.create_clip_markers(" + jsonData + ")", function(response) { set_status(); });
        } else {
    		csi.evalScript("$.markerboxPanel.create_sequence_markers(" + jsonData + ")", function(response) { set_status(); });
        }

		// Output the converted data to the drop zone (for testing only)
		if(1 == 0)
			{
			dropzoneArray = [];
			if(Array.isArray(csvData.times)) for(i=0; i<csvData.times.length; i++) dropzoneArray[i] = csvData.times[i];
			if(Array.isArray(csvData.durations)) for(i=0; i<dropzoneArray.length; i++) dropzoneArray[i] += "\t" + csvData.durations[i];
			if(Array.isArray(csvData.ends)) for(i=0; i<dropzoneArray.length; i++) dropzoneArray[i] += "\t" + csvData.ends[i];
			if(Array.isArray(csvData.colors)) for(i=0; i<dropzoneArray.length; i++) dropzoneArray[i] += "\t" + csvData.colors[i];
			if(Array.isArray(csvData.types)) for(i=0; i<dropzoneArray.length; i++) dropzoneArray[i] += "\t" + csvData.types[i];
			if(Array.isArray(csvData.names)) for(i=0; i<dropzoneArray.length; i++) dropzoneArray[i] += "\t" + csvData.names[i];
			if(Array.isArray(csvData.comments)) for(i=0; i<dropzoneArray.length; i++) dropzoneArray[i] += "\t" + csvData.comments[i];

			// Get rid of line breaks in comments
			for(i=0; i<dropzoneArray.length; i++) dropzoneArray[i] = dropzoneArray[i].replace(/\n/gi, "\0");

			dropzoneString = dropzoneArray.join("\n");
			dropzone.value = dropzoneString;
			}
		}
	catch(e)
		{
		if(e.type == "settings")
			alertbox("Error in the settings (error code " + e.code + "). Please check your syntax or reset\nthe settings to the previous version.", "ERROR", true);
			// elaborate this, based on the error codes
		else if(e.type == "cancel")
			{ }
		else if(e.type == "fileread")
			alertbox("Cannot read the file (error code " + e.code + ").", "ERROR", true);
		else if(e.type == "badcsv") {
			alertbox(e.message, "ERROR", true);
		}
		else
			{
			if(typeof(e) == "string") alertbox(e, "ERROR", true);
			else alertbox(e.type + "\n" + e.message + "\n" + e.stack, "ERROR", true);
			}
		// Reset the statusbar
		set_status();
		}
	}



function import_screenlight(csvString)
	{
	/*
	Parses a Screenlight CSV file and returns a marker data object.
	Called by master function import_markers() above.

	Columns:
		0 = name of reviewers
		1 = timestamp in seconds
		2 = duration in seconds
		3 = HEX color value (doesn't do anything though!)
		4 = comment by the reviewer

	Sample:

		Header, as of 2021.03.26:
		"Screenlight Premiere Pro Marker Export 1.0",,,,
		"Name:","Time:","Duration:","Marker Color:","Comment:"

		Data row, as of 2021.03.26:
		"Chris Potterer",63.1464166666667,0,#718637,"Being creative is awesome."

	*/
	set_status("Importing reviews from Screenlight ...","loader");
	var typeArray = [];
	var delimiter = ",";
	var i, ii;

	// Check the header: Is this a valid Screenlight CSV?
	// More about regular expressions: https://developer.mozilla.org/docs/Web/JavaScript/Guide/Regular_Expressions
	// This one was taken directly from the Screenlight extension for best possible compatibility
	var regEx = /^\s*"\s*Screenlight\s+Premiere\s+Pro\s+Marker\s+Export\s+([\d.]+)"\s*,\s*,\s*,\s*,\s*\n"Name:"\s*,\s*"Time:"\s*,\s*"Duration:"\s*,\s*"Marker Color:"\s*,\s*"Comment:"\s*\n/;
	var regResult = regEx.exec(csvString);
	if (regResult == null || regResult.length < 2)
		throw { type: "badcsv", message: "This is not a Screenlight CSV marker file\nfor Adobe Premiere Pro. " };
	var version = parseFloat(regResult[1]);
	if (version != 1)
		throw { type: "badcsv", message: "Markerbox supports Screenlight CSV version 1.0 only.\nThis Screenlight CSV file has the version " + regResult[1] + ".\nPlease get in touch with Markerbox. We will help you."};

	// The header is okay, so let's get rid of it and and extract the data arrays from the string
	csvString = csvString.substr(regResult[0].length);
	var csvArray = csv_to_array(csvString, delimiter);

	// Check the validity of the array: It must be an array of 5 arrays
	if (csvArray.length < 5)
		throw { type: "badcsv", message: "There are less than 5 data-columns in the CSV file.\nThis is not a valid Screenlight file format." };

	// Prefill typeArray with "Comment".
	for (i=0; i<csvArray[0].length; i++) typeArray[i] = PREF_SCREENLIGHT_MARKER_TYPE;

	// The colors in the 4th column of the Screenlight CSV have no meaning.
	// Let's use this column to put real colors in there, as defined in _SETTINGS.js.
	for (i=0; i<csvArray[3].length; i++) csvArray[3][i] = PREF_SCREENLIGHT_MARKER_COLOR;
	if(PREF_SCREENLIGHT_MULTICOLOR_MODE == 2)
		{
		for (i=0; i<csvArray[0].length; i++)
			{
			for(ii=0; ii<PREF_SCREENLIGHT_MULTICOLOR_RULES.length; ii++)
				{
				if(csvArray[0][i].indexOf(PREF_SCREENLIGHT_MULTICOLOR_RULES[ii][0]) == 0)
					{
					csvArray[3][i] = PREF_SCREENLIGHT_MULTICOLOR_RULES[ii][1];
					typeArray[i] = PREF_SCREENLIGHT_MULTICOLOR_RULES[ii][2];
					break;
					}
				}
			}
		}

	// Convert times to float, just to make sure
	for (i=0; i<csvArray[1].length; i++) csvArray[1][i] = parseFloat(csvArray[1][i]);
	for (i=0; i<csvArray[2].length; i++) csvArray[2][i] = parseFloat(csvArray[2][i]);

	// Everything seems fine, so let's create the actual marker data
	var markerData =
		{
		times:		csvArray[1],
		durations:	csvArray[2],
		names:		csvArray[0],
		comments:	csvArray[4],
		types:		typeArray,
		colors:		csvArray[3]
		};
	return markerData;
	}



function import_vimeo(csvString)
	{
	/*
	Parses a Vimeo CSV file and returns a marker data object.
	Called by master function import_markers() above.

	Columns:
		0 = Video name		(totally useless)
		1 = number			(totally useless)
		2 = timecode		(hh:mm:ss)
		3 = username		(can be used for color coding)
		4 = Note			(= comment)
		5 = Reply			(key challenge here!!!)
		6 = Date added		(can we use this?)
		7 = Resolved		(Yes/No, use for color coding)

	Sample, as of 2021-04-10:
  		"Video Version","#","Timecode","Username","Note","Reply","Date Added","Resolved"
		"Unknown file name",1,00:00:13,"Vi Deo","sdfsdfgsdfg sdfg sdfg sdfg sdfg sdfg sdfg sdfg sdfg",--,"Mittwoch, 24. März 2021 Um 18:55",No
		"Unknown file name",2,00:01:52,"Test User","fghdf hgdfghdfghdfghdfghdfgh",--,"Mittwoch, 24. März 2021 Um 19:09",Yes
		,3,00:01:52,"Vi Deo","fghdf hgdfghdfghdfghdfghdfgh","Dies ist eine Testantwort","Samstag, 27. März 2021 Um 08:43",Yes
		,4,00:01:52,"Vi Deo","fghdf hgdfghdfghdfghdfghdfgh","Dies ist eine weitere Antwort","Samstag, 27. März 2021 Um 08:44",Yes
		,,,,,,,

	To consider:
		Vimeo has no marker duration
		Answers are in a different column than the initial comment
		Username & Resolved can be used for color coding
		There's always a row of empty cells at the end
	*/
	set_status("Importing comments from Vimeo ...","loader");

	var i, ii;
	var commentArray = [];
	var colorArray = [];
	var typeArray = [];
	var timeArray = [];
	var delimiter = ",";
	// For the moment, we won't check the header but will simply delete it.
	// More about regular expressions: https://developer.mozilla.org/docs/Web/JavaScript/Guide/Regular_Expressions
	var regEx = /^.*\n/;
	var regResult = regEx.exec(csvString);
	if (regResult == null || regResult.length < 1 )
		throw {type: "badcsv", message: "The CSV file doesn't seem to contain any data."};

	// The header is okay, so let's get rid of it and and extract the data arrays from the string
	csvString = csvString.substr(regResult[0].length);
	var csvArray = csv_to_array(csvString, delimiter);

	// Check the validity of the array: It must be an array of at least 4 arrays. More columns are optional.
	if (csvArray.length < 8)
		throw {type: "badcsv", message: "The data in the Vimeo CSV file do not have the expected format."};

	// Pre-processing: Merging comments and answers
	for(i=0; i<csvArray[0].length; i++)
		{
		// Correct some Vimeo crap in the time stamps
		csvArray[6][i] = csvArray[6][i].replace(" Um ", " um ");	// German
		csvArray[6][i] = csvArray[6][i].replace(" At ", " at ");	// German
		csvArray[6][i] = csvArray[6][i].replace(" AM", " a.m.");	// English
		csvArray[6][i] = csvArray[6][i].replace(" PM", " p.m.");	// English
		csvArray[6][i] = csvArray[6][i].replace(/ De /g, " de ");	// Spanish & Portuguese

		// Move comment to comment array
		commentArray[i] = csvArray[4][i];

		// Add timestamp to comment
		commentArray[i] += "\n(" + csvArray[6][i] + ")";

		// Add resolved status to comment
		if(csvArray[7][i] == "Yes") commentArray[i] = "RESOLVED\n\n" + commentArray[i];

		// Is this an answer?
		//if(csvArray[0][i] == "" && csvArray[2][i] == csvArray[2][i-1] && csvArray[4][i] == csvArray[4][i-1])
		if(i > 0 && csvArray[0][i] == "" && csvArray[2][i] == csvArray[2][i-1] && csvArray[4][i] == csvArray[4][i-1])
			{
			// Answers as separate markers
			if(PREF_VIMEO_MERGE_ANSWERS == 0)
				{
				commentArray[i] = "Answer:\n" + csvArray[5][i] + "\n(" + csvArray[6][i] + ")";
				if(csvArray[7][i] == "Yes") commentArray[i] = "RESOLVED\n\n" + commentArray[i];
				}
			else
				{
				// Add answer to existing comment of previous row
				commentArray[i-1] += "\n\nAnswer by " + csvArray[3][i] + ":\n" + csvArray[5][i] + "\n(" + csvArray[6][i] + ")";
				// Delete this row
				for(ii=0; ii<csvArray.length; ii++) csvArray[ii].splice(i,1);
				commentArray.splice(i,1);
				// i-- otherwise we would skip the next row
				i--;
				}
			}
		}

	for (i=0; i<csvArray[0].length; i++)
		{
		// Delete empty rows first (normally the last row is empty)
		// Also delete resolved comments depending on the settings
		if(csvArray[2][i] == "" || !csvArray[2][i] || (csvArray[7][i] == "Yes" && PREF_VIMEO_RESOLVED_HIDE == 1))
			{
			for(ii=0; ii<csvArray.length; ii++) csvArray[ii].splice(i,1);
			commentArray.splice(i,1);
			typeArray.splice(i,1);
			colorArray.splice(i,1);
			// i-- otherwise we would skip the next row
			i--;
			}

		// Process the timecodes hh:mm:ss
		if (typeof(csvArray[2][i]) == "string")
			{
			timeArray = csvArray[2][i].split(":");
			if(timeArray.length != 3) csvArray[2][i] = 0;
			else csvArray[2][i] = parseInt(timeArray[0]) * 3600 + parseInt(timeArray[1]) * 60 + parseInt(timeArray[2]);
			}
		else csvArray[2][i] = 0;


		// Prefill typeArray with standard type and colorArray with standard color.
		typeArray[i] = PREF_VIMEO_MARKER_TYPE;
		colorArray[i] = PREF_VIMEO_MARKER_COLOR;

		// Overwrite with marker colors based on username
		if(PREF_VIMEO_MULTICOLOR_MODE == 2 || PREF_VIMEO_MULTICOLOR_MODE == 4)
			{
			for(ii=0; ii<PREF_VIMEO_MULTICOLOR_RULES.length; ii++)
				{
				if(csvArray[3][i].indexOf(PREF_VIMEO_MULTICOLOR_RULES[ii][0]) == 0)
					{
					colorArray[i] = PREF_VIMEO_MULTICOLOR_RULES[ii][1];
					typeArray[i] = PREF_VIMEO_MULTICOLOR_RULES[ii][2];
					}
				}
			}
		// Overwrite with marker colors based on resolved status
		if((PREF_VIMEO_MULTICOLOR_MODE == 3 || PREF_VIMEO_MULTICOLOR_MODE == 4) && csvArray[7][i] == "Yes")
			{
			colorArray[i] = PREF_VIMEO_RESOLVED_COLOR;
			typeArray[i] = PREF_VIMEO_RESOLVED_TYPE;
			}
		}

	// Everything seems fine, so let's create the actual marker data
	var markerData =
		{
		times:		csvArray[2],
		names:		csvArray[3],
		comments:	commentArray,
		types:		typeArray,
		colors:		colorArray
		};
	return markerData;
	}



function import_sequoia(csvString)
	{
	/*
	Parses a Sequoia CSV file and returns a marker data object.
	Called by master function import_markers() above.

	Columns:
		0 = track number
		1 = timestamp start in milliseconds
		2 = name of edit
		3 = duration in milliseconds
		4 = timestamp end in milliseconds
		5 = original timestamp start in milliseconds
		6 = original timestamp end in milliseconds

	Samples:
		German header, as of 2021.03.26 (this header depends on the language Sequoia is running in!)
		Spur,Position,Name,Länge,Ende,Originale Position,Originale Endposition

		German data row, as of 2021.03.26:
		1,13.864 ms,"Pr27",4.681 ms,18.545 ms,12.077.091,12.081.772

	Attention:
	Sequoia outputs what the sound engineer chooses.
	Markerbox expects exactly this order.
	*/
	set_status("Importing EDL from Sequoia ...","loader");

	var i, ii, counter;
	var colorArray = [];
	var typeArray = [];
	var delimiter = ",";
	// For the moment, we won't check the header but will simply delete it.
	// More about regular expressions: https://developer.mozilla.org/docs/Web/JavaScript/Guide/Regular_Expressions
	var regEx = /^.*\n/;
	var regResult = regEx.exec(csvString);
	if (regResult == null || regResult.length < 1 )
		throw {type: "badcsv", message: "The CSV file doesn't seem to contain any data."};

	// The header is okay, so let's get rid of it and and extract the data arrays from the string
	csvString = csvString.substr(regResult[0].length);
	var csvArray = csv_to_array(csvString, delimiter);

	// Check the validity of the array: It must be an array of at least 4 arrays. More columns are optional.
	if (csvArray.length < 4)
		throw {type: "badcsv", message: "The data in the Sequoia CSV file do not have the expected format."};

	// Delete all tracks we don't want to import markers from
	counter = 0;
	while(counter<csvArray[0].length)
		{
		if(csvArray[0][counter] != PREF_SEQUOIA_IMPORT_TRACK) for(i=0; i<csvArray.length; i++) csvArray[i].splice(counter, 1);
		else counter++;
		}

	// Pre-processing: Delete all dots and " ms" in the time values and convert milliseconds to seconds
	for (i=0; i<csvArray[1].length; i++) csvArray[1][i] = fix_sequoia_times(csvArray[1][i]);
	for (i=0; i<csvArray[3].length; i++) csvArray[3][i] = fix_sequoia_times(csvArray[3][i]);
	if (csvArray.length > 4) for (i=0; i<csvArray[4].length; i++) csvArray[4][i] = fix_sequoia_times(csvArray[4][i]);
	if (csvArray.length > 5) for (i=0; i<csvArray[5].length; i++) csvArray[5][i] = fix_sequoia_times(csvArray[5][i]);
	if (csvArray.length > 6) for (i=0; i<csvArray[6].length; i++) csvArray[6][i] = fix_sequoia_times(csvArray[6][i]);

	// Pre-processing: Delete quotes in the names.
	for (i=0; i<csvArray[2].length; i++) csvArray[2][i].replace(/\"/g, "");

	// Prefill typeArray with "Comment".
	for (i=0; i<csvArray[0].length; i++) typeArray[i] = PREF_SEQUOIA_MARKER_TYPE;

	// Set the marker colors as defined in _SETTINGS.js.
	for (i=0; i<csvArray[2].length; i++) colorArray[i] = PREF_SEQUOIA_MARKER_COLOR;
	if(PREF_SEQUOIA_MULTICOLOR_MODE == 2)
		{
		for (i=0; i<csvArray[2].length; i++)
			{
			for(ii=0; ii<PREF_SEQUOIA_MULTICOLOR_RULES.length; ii++)
				{
				if(csvArray[2][i].indexOf(PREF_SEQUOIA_MULTICOLOR_RULES[ii][0]) == 0)
					{
					colorArray[i] = PREF_SEQUOIA_MULTICOLOR_RULES[ii][1];
					typeArray[i] = PREF_SEQUOIA_MULTICOLOR_RULES[ii][2];
					break;
					}
				}
			}
		}

	// Everything seems fine, so let's create the actual marker data
	var markerData =
		{
		times:		csvArray[1],
		durations:	csvArray[3],
		names:		csvArray[2],
		types:		typeArray,
		colors:		colorArray
		};
	return markerData;
	}



function import_premiere(csvString)
	{
	/*
	Re-imports markers previously exported from Premiere as a CSV file and returns a marker data object.
	Called by master function import_markers() above.

	Columns:
		0 = marker name
		1 = comments / description
		2 = timestamp start as timecode
		3 = timestamp end as timecode
		4 = duration as timecode
		5 = marker type

	Sample:

		English header, as of 2021.03.26:
		Marker Name	Description	In	Out	Duration	Marker Type

		English data row with 25 fps timecode, as of 2021.03.26:
		Name	Some comment	00:08:22:23	00:08:22:23	00:00:00:00	Comment

		English data row with 29.97 fps drop-frame, as of 2021.02.26:
		Test	Some comment here	00;11;23;01	00;11;24;25	00;00;01;24	Chapter

	To consider:
		- Tab as delimiter
		- No information about the original timecode format
		- Colors are not preserved

	*/
	set_status("Re-importing Premiere markers ...","loader");

	var tcFormat = activeSequenceTimecodeFormat;
	var i,ii;
	var colorArray = [];
	var delimiter = "\t";

	// For the moment, we won't check the header but will simply delete it.
	// More about regular expressions: https://developer.mozilla.org/docs/Web/JavaScript/Guide/Regular_Expressions
	var regEx = /^.*\n/;
	var regResult = regEx.exec(csvString);
	if (regResult == null || regResult.length < 1 )
		throw { type: "badcsv", message:"The CSV file doesn't seem to contain any data."};

	// The header is okay, so let's get rid of it and and extract the data arrays from the string
	csvString = csvString.substr(regResult[0].length);
	var csvArray = csv_to_array(csvString, delimiter);

	// Check the validity of the array: It must be an array of exactly 6 arrays.
	if (csvArray.length < 6)
		throw { type: "badcsv", message:"This is not an original Premiere Pro CSV export file."};

	// Set the marker colors according to the Premiere standard (colors are not preserved on export).
	for (i=0; i<csvArray[5].length; i++)
		{
		if(csvArray[5][i] == "Comment") colorArray[i] = 0;
		else if(csvArray[5][i] == "Chapter") colorArray[i] = 1;
		else if(csvArray[5][i] == "Segmentation") colorArray[i] = 2;
		else if(csvArray[5][i] == "WebLink") colorArray[i] = 3;
		else colorArray[i] = 5;
		}

	// Reject unsupported timecode formats
	/*
	100 TIMEDISPLAY_24Timecode
	101 TIMEDISPLAY_25Timecode
	102 TIMEDISPLAY_2997DropTimecode
	103 TIMEDISPLAY_2997NonDropTimecode
	104 TIMEDISPLAY_30Timecode
	105 TIMEDISPLAY_50Timecode
	106 TIMEDISPLAY_5994DropTimecode
	107 TIMEDISPLAY_5994NonDropTimecode
	108 TIMEDISPLAY_60Timecode
	109 TIMEDISPLAY_Frames
	110 TIMEDISPLAY_23976Timecode
	111 TIMEDISPLAY_16mmFeetFrames
	112 TIMEDISPLAY_35mmFeetFrames
	113 TIMEDISPLAY_48Timecode
	200 TIMEDISPLAY_AudioSamplesTimecode
	201 TIMEDISPLAY_AudioMsTimecode
	*/

	// ++++++++++ MAKE SURE THE TIMECODE IS LOADED AND NOT "";
	// while(tcFormat == "" ) ...
	var unsupportedTimecodes = "109 111 112 200 201";
	if(unsupportedTimecodes.indexOf(tcFormat) != -1)
		throw { type: "timecode", message:"Sorry, the timecode format of your active sequence is currently not supported."};

	// Convert the timecode to seconds.
	csvArray[2] = timecode_to_seconds(csvArray[2],tcFormat);
	csvArray[3] = timecode_to_seconds(csvArray[3],tcFormat);
	csvArray[4] = timecode_to_seconds(csvArray[4],tcFormat);

	//for(i=0; i<csvArray.length; i++) for(ii=0; ii<csvArray[i].length; ii++) csvArray[i][ii] = encodeURIComponent(csvArray[i][ii]);

	// Everything seems fine, so let's create the actual marker data
	var markerData =
		{
		names:		csvArray[0],
		comments:	csvArray[1],
		times:		csvArray[2],
		ends:		csvArray[3],
		durations:	csvArray[4],
		types:		csvArray[5],
		colors:		colorArray
		};

	return markerData;
	}



function import_dropzone(csvString)
	{
	/*
	Imports markers from the textarea on the right
	Called by master function import_markers() above.

	Do not add headers or empty columns or empty rows!
	Empty fields for optional values are okay.

	Allowed time formats:
	Timecode: 00:00:00:00 or 00;00;00;00 or 00:00:00:000
	Time:     hh:mm:ss    or mm:ss       or seconds (with optional decimal places)
	Timecodes with frames must match the timecode format of your active sequence!

	Allowed marker colors:
	0=green, 1=red, 2=rose, 3=orange, 4=yellow, 5=white, 6=blue, 7=teal
	(these values will override your color settings)

	Allowed marker types:
	Chapter, Segmentation, WebLink or Comment

	Column 1 (required): Marker position
	Column 2 (optional): Marker duration or end time
	Column 3 (optional): Color of marker
	Column 4 (optional): Marker type
	Column 5 (optional): Name of marker
	Column 5 (optional): Comment

	To consider:
		- Tab as delimiter
		- No information about the original timecode format

	*/
	set_status("Importing markers from drop zone ...","loader");
	var tcFormat = activeSequenceTimecodeFormat;
	var i, ii, emptyCol, prevStructure;
	var delimiter = (dropzoneDelimiter || "\t");
	var structure = [];
	var colToCheck = 1;
	var timeUnit = "";
	var msDelimiter = ".";

	// There is no header, so we don't need to analyze or delete anything
	var csvArray = csv_to_array(csvString, delimiter);

	// Check the validity of the array: It must be an array of at least one array.
	if (csvArray.length < 1)
		if(dropzone.value.trim() != "") throw { type: "badcsv", message:"I've tried my best, but I cannot import your data. I suggest you pre-format your import and/or edit you data in a spreadsheet editor first."};
		else throw { type: "badcsv", message:"There don't seem to be any data in the text area."};

	// Set the marker colors according to the Premiere standard (colors are not preserved on export).
	/*for (i=0; i<csvArray[5].length; i++)
		{
		if(csvArray[5][i] == "Comment") colorArray[i] = 0;
		else if(csvArray[5][i] == "Chapter") colorArray[i] = 1;
		else if(csvArray[5][i] == "Segmentation") colorArray[i] = 2;
		else if(csvArray[5][i] == "WebLink") colorArray[i] = 3;
		else colorArray[i] = 5;
		}*/

	var timeStr = preprocess_time(csvArray[0])[csvArray[0].length-1];

	// Is the first column time or timecode? Or something else?
	// The first value could just be a zero. Higher values give us more to analyze. So let's take the last value of the first array.
	// It would be better to repeat this with every single value. Maybe in the future?
	var timeArrCol = timeStr.split(":");
	var timeArrDot = timeStr.split(".");
	var timeHasDot = false;

	if(timeArrCol.length == 3 && timeArrCol[1].length == 2 && timeArrCol[2].length == 2) tcFormat = "time"; // hh:mm:ss
	else if(timeArrCol.length == 3 && timeArrCol[1].length == 2 && timeArrCol[2].indexOf(".") > 0) tcFormat = "time"; // hh:mm:ss.ms
	else if(timeArrCol.length == 2 && timeArrCol[0].length <= 2 && timeArrCol[1].length == 2) tcFormat = "time"; // mm:ss
	else if(timeArrCol.length == 2 && timeArrCol[0].length <= 2 && timeArrCol[1].indexOf(".") > 0) tcFormat = "time"; // mm:ss.ms
	else if(timeArrDot.length == 3 && timeArrDot[0].length <= 2 && timeArrDot[1].length == 2 && timeArrDot[2].length == 2 && parseInt(timeArrDot[0]) < 25 && parseInt(timeArrDot[1]) < 60 && parseInt(timeArrDot[2]) < 60) timeHasDot = true; // hh.mm.ss
	else if(timeArrDot.length == 2 && timeArrDot[0].length <= 2 && timeArrDot[1].length == 2 && parseInt(timeArrDot[0]) < 300 && parseInt(timeArrDot[1]) < 60) timeHasDot = true;	// mm.ss
	else if(timeStr.indexOf(":") == -1 && timeStr.indexOf(";") == -1 && timeArrDot.length <= 2) tcFormat = "seconds";
	else if(timeArrCol.length == 4 && timeArrCol[1].length == 2 && timeArrCol[2].length >= 2 && timeArrCol[2].length <= 3) {} // timecode
	else throw { type: "badcsv", message:"Sorry, I cannot identify the values in the first column as any time or timecode. Please check."};

	if(timeHasDot)
		{
		tcFormat = "time";
		for(i=0; i<csvArray[0].length; i++) csvArray[0][i] = csvArray[0][i].replace(/\./g, ":");
		}
	structure[0] = tcFormat;

	// Walk through all the other columns and check what's in there
	var tempStr = "";
	var allowedColors = " 0 green 1 red 2 rose pink 3 orange 4 yellow 5 white 6 blue 7 teal cyan ";
	var allowedTypes = " chapter segmentation weblink comment ";
	while(colToCheck < csvArray.length)
		{
		structure[colToCheck] = "";
		if(colToCheck < 2) var tempStr = preprocess_time(csvArray[colToCheck])[csvArray[0].length-1];
		else tempStr = csvArray[colToCheck][0];

		// Is this a time or timecode?
		if(colToCheck < 2)
			{
			// Do more checking below, especially: Is the format the same as in column 0?
			if(tcFormat == "time" && tempStr.split(":").length == 3) structure[colToCheck] = "time";
			else if(timeHasDot && tempStr.split(".").length == 3) structure[colToCheck] = "time";
			else if(tcFormat == "time" && tempStr.split(":").length == 2) structure[colToCheck] = "time";
			else if(timeHasDot && tempStr.split(".").length == 2) structure[colToCheck] = "time";
			else if(tempStr.split(":").length == 4) structure[colToCheck] = tcFormat;
			else if(tempStr.split(";").length == 4) structure[colToCheck] = tcFormat;
			else if(tempStr.indexOf(":") == -1 && tempStr.indexOf(";") == -1)
				{
				// Could these be seconds?
				structure[colToCheck] = "seconds";
				for(i=0; i<csvArray[colToCheck].length; i++) if(csvArray[colToCheck][i] != "" && isNaN(csvArray[colToCheck][i])) structure[colToCheck] = "";
				}
			if(structure[colToCheck] == "time" && timeHasDot)
				for(i=0; i<csvArray[colToCheck].length; i++) csvArray[colToCheck][i] = csvArray[colToCheck][i].replace(/\./g, ":");
			}

		// Is this a color? (Don't forget: Not every field may have a value)
		// Important: Colors could have been misinterpreted as seconds.
		// To check that prevStructure has been added. Color detection will override seconds!
		if(colToCheck < 3 && (structure[colToCheck] == "" || structure[colToCheck] == "seconds"));
			{
			prevStructure = structure[colToCheck];
			if(!structure.includes("color")) structure[colToCheck] = "color";
			for(i=0; i<csvArray[colToCheck].length; i++) if(csvArray[colToCheck][i] != "" && allowedColors.indexOf(" "+csvArray[colToCheck][i].toLowerCase()+" ") == -1) structure[colToCheck] = prevStructure;
			}

		// Is this a type?
		if(colToCheck < 4 && structure[colToCheck] == "")
			{
			if(!structure.includes("type")) structure[colToCheck] = "type";
			for(i=0; i<csvArray[colToCheck].length; i++) if(csvArray[colToCheck][i] != "" && allowedTypes.indexOf(" "+csvArray[colToCheck][i].toLowerCase()+" ") == -1) structure[colToCheck] = "";
			}

		// Is this a name? Well, can't be anything else at this point
		if(colToCheck < 5 && structure[colToCheck] == "")
			{
			if(!structure.includes("name")) structure[colToCheck] = "name";
			}

		// Is this a comment?
		if(structure[colToCheck] == "")
			{
			if(!structure.includes("comment")) structure[colToCheck] = "comment";
			}
		colToCheck++;
		}

	// For timecode_to_seconds() to work we must make sure the first array item of the second column includes the delimiter
	if(csvArray.length > 1 && structure[1] == activeSequenceTimecodeFormat)
		{
		if(csvArray[0][0].indexOf(":") > -1 && csvArray[1][0].trim() == "") csvArray[1][0] = ":";
		else if(csvArray[0][0].indexOf(";") > -1 && csvArray[1][0].trim() == "") csvArray[1][0] = ";";
		}

	// Delete all empty columns or meaningsless columns
	for(i=0; i<csvArray.length; i++)
		{
		emptyCol = true;
		for(ii=0; ii<csvArray[i].length; ii++) if(String(csvArray[i][ii]).trim() != "") emptyCol = false;
		if(emptyCol || structure[i] == "")
			{
			structure.splice(i,1);
			csvArray.splice(i,1);
			i--;
			}
		}

	if(structure[0] == "time") time_to_seconds(csvArray[0]);
	if(structure[1] == "time") time_to_seconds(csvArray[1]);

	// Seconds must be converted to integers
	if(structure[0] == "seconds") for(i=0; i<csvArray[0].length; i++) csvArray[0][i] = parseFloat(csvArray[0][i]);
	if(structure[1] == "seconds") for(i=0; i<csvArray[1].length; i++) csvArray[1][i] = parseFloat(csvArray[1][i]);

	if(tcFormat == activeSequenceTimecodeFormat)
		{
		// Reject unsupported timecode formats
		/*
		100 TIMEDISPLAY_24Timecode
		101 TIMEDISPLAY_25Timecode
		102 TIMEDISPLAY_2997DropTimecode
		103 TIMEDISPLAY_2997NonDropTimecode
		104 TIMEDISPLAY_30Timecode
		105 TIMEDISPLAY_50Timecode
		106 TIMEDISPLAY_5994DropTimecode
		107 TIMEDISPLAY_5994NonDropTimecode
		108 TIMEDISPLAY_60Timecode
		109 TIMEDISPLAY_Frames
		110 TIMEDISPLAY_23976Timecode
		111 TIMEDISPLAY_16mmFeetFrames
		112 TIMEDISPLAY_35mmFeetFrames
		113 TIMEDISPLAY_48Timecode
		200 TIMEDISPLAY_AudioSamplesTimecode
		201 TIMEDISPLAY_AudioMsTimecode
		*/

		// ++++++++++ MAKE SURE THE TIMECODE IS LOADED AND NOT "";
		// while(tcFormat == "" ) ...
		var unsupportedTimecodes = "109 111 112 200 201";
		if(unsupportedTimecodes.indexOf(tcFormat) != -1)
			throw { type: "timecode", message:"Sorry, the timecode format of your active sequence is currently not supported."};

		// Convert the timecode to seconds.
		csvArray[0] = timecode_to_seconds(csvArray[0],tcFormat);
		if(structure[1] == tcFormat) timecode_to_seconds(csvArray[1],tcFormat);
		}
	// Put together markerData
	var markerData =
		{
		names:		null,
		comments:	null,
		times:		csvArray[0],
		ends:		null,
		durations:	null,
		types:		null,
		colors:		null
		};

	// 2nd column durations or end times?
	if(structure.length > 1)
		{
		if(structure[1] == tcFormat)
			{
			var isEnd = true;
			for(i=0; i<csvArray[1].length; i++) if(csvArray[0][i] > csvArray[1][i]) isEnd = false;
			if(isEnd) markerData.ends = csvArray[1];
			else markerData.durations = csvArray[1];
			}
		for(i=1; i<structure.length; i++)
			{
			//alert(structure[i]);
			if(structure[i] == "color")
				{
				// Fix values and asign to markerData
				for(ii=0; ii<csvArray[i].length; ii++)
					{
					csvArray[i][ii] = csvArray[i][ii].replace(/green/i, "0");
					csvArray[i][ii] = csvArray[i][ii].replace(/red/i, "1");
					csvArray[i][ii] = csvArray[i][ii].replace(/rose|pink/i, "2");
					csvArray[i][ii] = csvArray[i][ii].replace(/orange/i, "3");
					csvArray[i][ii] = csvArray[i][ii].replace(/yellow/i, "4");
					csvArray[i][ii] = csvArray[i][ii].replace(/white/i, "6");
					csvArray[i][ii] = csvArray[i][ii].replace(/blue/i, "6");
					csvArray[i][ii] = csvArray[i][ii].replace(/teal|cyan/i, "7");
					if(csvArray[i][ii] == "") csvArray[i][ii] = PREF_TEXTAREA_MARKER_COLOR;
					csvArray[i][ii] = parseInt(csvArray[i][ii]);
					}
				markerData.colors = csvArray[i];
				}
			else if(structure[i] == "type")
				{
				// Fix values and asign to markerData
				for(ii=0; ii<csvArray[i].length; ii++)
					{
					csvArray[i][ii] = csvArray[i][ii].replace(/chapter/i, "Chapter");
					csvArray[i][ii] = csvArray[i][ii].replace(/segmentation/i, "Segmentation");
					csvArray[i][ii] = csvArray[i][ii].replace(/weblink/i, "WebLink");
					csvArray[i][ii] = csvArray[i][ii].replace(/comment/i, "Comment");
					if(csvArray[i][ii] == "") csvArray[i][ii] = PREF_TEXTAREA_MARKER_TYPE;
					}
				markerData.types = csvArray[i];
				}
			else if(structure[i] == "name") markerData.names = csvArray[i];
			else if(structure[i] == "comment")
				{
				// Replace \0 with \n (\0 was put in to display comments without line breaks in the drop zone)
				for(ii=0; ii<csvArray[i].length; ii++) csvArray[i][ii] = csvArray[i][ii].replace(/\0/g, "\n");
				markerData.comments = csvArray[i];
				}
			}
		}
	// Last thing to do: If there is no type and/or color we must add this here, based on the settings
	if(markerData.types == null)
		{
		var typeArray = [];
		for(i=0; i<csvArray[0].length; i++) typeArray[i] = PREF_TEXTAREA_MARKER_TYPE;
		markerData.types = typeArray;
		}
	if(markerData.colors == null)
		{
		var colorArray = [];
		for(i=0; i<csvArray[0].length; i++) colorArray[i] = PREF_TEXTAREA_MARKER_COLOR;
		markerData.colors = colorArray;
		}
	return markerData;
	}



//---------- HELPER FUNCTIONS ----------



function upgrade_settings()
    {
	// This is a first test to update old settings files to new versions.
	// No error handling yet
	// General concept: Read default settings, replace content by custom settings and save everything as new custom settings.

	function save_custom_settings()
		{
		var result;
		// Does the Markerbox folder exist already exist? If not create it.
		if(!window.cep.fs.stat(user_data_path()).data.isDirectory())
			{
			result = window.cep.fs.makedir(user_data_path());
			if(result.err != 0)
				{
				// No alert, just return. Markerbox will still work.
				return false;
				}
			}
		// We will not check the filename of Javascript here
		result = window.cep.fs.writeFile(custom_settings_filename(), strCustom);
		// No alert of any kind. Markerbox will work without saving the settings.
		}

	// We definitely need the default settings so check this first
	var readDefault = window.cep.fs.readFile(default_settings_filename());
	var ed = readDefault.err;
	var strDefault = readDefault.data;
	if(ed != 0)
		{
		if (ed == 2 || ed == 3) alertbox("The Markerbox default settings file could not be found (error 2/3). Reinstall Markerbox.", "ERROR", true);
		else if (ed == 5) alertbox("Your operating system denied the access to the Markerbox default settings file (error 5). Without this file Markerbox will not work properly. Restart your computer and try again.", "ERROR", true);
		else if (ed == 30) alertbox("There was an error reading the Markerbox default settings file (error 30). Reinstall Markerbox.", "ERROR", true);
		else if (ed == 32 || ed== 33) alertbox("Markerbox cannot access the default settings file because it is open in another program (error 32/33). Close any applications or editors that might be using the file and try again. If that doesn't help restart your computer and try again.", "ERROR", true);
		else alertbox("Markerbox cannot read the default settings file (error " + ed + "). Without this file Markerbox will not work properly. Restart your computer and try again.", "ERROR", true);
		return false;
		}

	// Now check the custom settings.
	var readCustom = window.cep.fs.readFile(custom_settings_filename());
	var ec = readCustom.err;
	var strCustom = readCustom.data;

	// No custom settings found: Attempt to create them and return
	if(ec == 2 || ec == 3)
		{
		strCustom = strDefault;
		save_custom_settings();
		return true;
		}

	// Other errors
	if (ec == 5)
		{
		alertbox("Your operating system denied the access to your custom settings (error 5). Markerbox will run with default settings.", "ERROR", true);
		return false;
		}
	if (ec == 30)
		{
		strCustom = strDefault;
		save_custom_settings();
		alertbox("There was an error reading your custom settings (error 30). Markerbox tried to replace them with the default settings. If this error occurs again try deleting your custom settings file manually.", "ERROR", true);
		return false;
		}
	if (ec == 32 || ec== 33)
		{
		alertbox("Markerbox cannot access your custom settings file because it is open in another program (error 32/33). Markerbox will run with default settings.", "ERROR", true);
		return false;
		}
	if (ec != 0)
		{
		alertbox("Markerbox cannot read the settings file (error " + ec + "). Markerbox will run with default settings.", "ERROR", true);
		return false;
		}

	// This is where the fun begins: Replace all variables in the source code.

	var defaultCode, customCode, i;

	var prefs =
		[
		/PREF_TEXTAREA_MARKER_COLOR.*;/,
		/PREF_TEXTAREA_MARKER_TYPE.*;/,

		/PREF_SCREENLIGHT_MARKER_COLOR.*;/,
		/PREF_SCREENLIGHT_MARKER_TYPE.*;/,
		/PREF_SCREENLIGHT_MULTICOLOR_MODE.*;/,
		/PREF_SCREENLIGHT_AUTOCOLOR_ORDER.*;/,
		/PREF_SCREENLIGHT_MULTICOLOR_RULES(?:.|\s)*?\];/,

		/PREF_VIMEO_MARKER_COLOR.*;/,
		/PREF_VIMEO_MARKER_TYPE.*;/,
		/PREF_VIMEO_MULTICOLOR_MODE.*;/,
		/PREF_VIMEO_AUTOCOLOR_ORDER.*;/,
		/PREF_VIMEO_MULTICOLOR_RULES(?:.|\s)*?\];/,
		/PREF_VIMEO_RESOLVED_HIDE.*;/,
		/PREF_VIMEO_RESOLVED_COLOR.*;/,
		/PREF_VIMEO_RESOLVED_TYPE.*;/,
		/PREF_VIMEO_MERGE_ANSWERS.*;/,

		/PREF_SEQUOIA_IMPORT_TRACK.*;/,
		/PREF_SEQUOIA_MARKER_COLOR.*;/,
		/PREF_SEQUOIA_MARKER_TYPE.*;/,
		/PREF_SEQUOIA_MULTICOLOR_MODE.*;/,
		/PREF_SEQUOIA_AUTOCOLOR_ORDER.*;/,
		/PREF_SEQUOIA_MULTICOLOR_RULES(?:.|\s)*?\];/
		];

	for(i=0; i<prefs.length; i++)
		{
		defaultCode = prefs[i];
		customCode = defaultCode.exec(strCustom);
		if(customCode != null) strDefault = strDefault.replace(defaultCode, customCode[0]);
		//alert(customCode[0].length + "\n\n" + customCode[0]);
		}

	strCustom = strDefault;
	save_custom_settings();
	}



function load_settings()
    {
	// Attempt to open custom settings first. If they don't exist open the default settings.
	var readResult = window.cep.fs.readFile(custom_settings_filename());
	if(readResult.err != 0) readResult = window.cep.fs.readFile(default_settings_filename());

	// If we still have an error here show an error message
	var e = readResult.err;
	if(e != 0)
		{
		if (e == 2 || e == 3) alertbox("The Markerbox settings file could not be found (error 2/3).", "ERROR", true);
		else if (e == 5) alertbox("Your operating system denied the access to the Markerbox settings file (error 5).", "ERROR", true);
		else if (e == 30) alertbox("There was an error reading the Markerbox settings file (error 30).", "ERROR", true);
		else if (e == 32 || e == 33) alertbox("Markerbox cannot access the settings file because it is open in another program (error 32/33).", "ERROR", true);
		else alertbox("Markerbox cannot read the settings file (error " + e + ").", "ERROR", true);
		return false;
		}

	return readResult.data;
	}



function settings_error()
	{
	var markerTypes = " Comment Chapter Segmentation WebLink ";
	var markerColors = " 0 1 2 3 4 5 6 7 ";
	var markerModes = " 0 1 2 ";
	var markerBools = " 0 1 ";
	var i;

	if(SETTINGS != "ok") return "101";

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

	if(typeof(PREF_TEXTAREA_MARKER_COLOR) != "number") return "410a";
	if(markerColors.indexOf(String(PREF_TEXTAREA_MARKER_COLOR)) == -1) return "410b";

	if(typeof(PREF_TEXTAREA_MARKER_TYPE) != "string") return "420a";
	if(markerTypes.indexOf(String(PREF_TEXTAREA_MARKER_TYPE)) == -1) return "420b";

	if(typeof(PREF_VIMEO_MARKER_COLOR) != "number") return "510a";
	if(markerColors.indexOf(String(PREF_VIMEO_MARKER_COLOR)) == -1) return "510b";

	if(typeof(PREF_VIMEO_MARKER_TYPE) != "string") return "520a";
	if(markerTypes.indexOf(String(PREF_VIMEO_MARKER_TYPE)) == -1) return "520b";

	if(typeof(PREF_VIMEO_MULTICOLOR_MODE) != "number") return "530a";
	if(markerModes.indexOf(String(PREF_VIMEO_MULTICOLOR_MODE)) == -1) return "530b";

	if(typeof(PREF_VIMEO_AUTOCOLOR_ORDER) != "object") return "540a";
	if(!Array.isArray(PREF_VIMEO_AUTOCOLOR_ORDER)) return "540b";
	for(i=0; i<PREF_VIMEO_AUTOCOLOR_ORDER.length; i++)
		{
		if(typeof(PREF_VIMEO_AUTOCOLOR_ORDER[i]) != "number") return "540c" + i;
		else if(markerColors.indexOf(String(PREF_VIMEO_AUTOCOLOR_ORDER[i])) == -1) return "540d" + i;
		}

	// Check the multicolor rules here (PREF_VIMEO_MULTICOLOR_RULES, error 550).

	if(typeof(PREF_VIMEO_RESOLVED_HIDE) != "number") return "560a";
	if(markerBools.indexOf(String(PREF_VIMEO_RESOLVED_HIDE)) == -1) return "560b";

	if(typeof(PREF_VIMEO_RESOLVED_COLOR) != "number") return "570a";
	if(markerColors.indexOf(String(PREF_VIMEO_RESOLVED_COLOR)) == -1) return "570b";

	if(typeof(PREF_VIMEO_RESOLVED_TYPE) != "string") return "580a";
	if(markerTypes.indexOf(String(PREF_VIMEO_RESOLVED_TYPE)) == -1) return "580b";

	if(typeof(PREF_VIMEO_MERGE_ANSWERS) != "number") return "590a";
	if(markerBools.indexOf(String(PREF_VIMEO_MERGE_ANSWERS)) == -1) return "590b";

	return "none";
	}



function timecode_to_seconds(tcArray, tcFormat)
	{
	/*
	100 TIMEDISPLAY_24Timecode
	101 TIMEDISPLAY_25Timecode
	102 TIMEDISPLAY_2997DropTimecode
	103 TIMEDISPLAY_2997NonDropTimecode
	104 TIMEDISPLAY_30Timecode
	105 TIMEDISPLAY_50Timecode
	106 TIMEDISPLAY_5994DropTimecode
	107 TIMEDISPLAY_5994NonDropTimecode
	108 TIMEDISPLAY_60Timecode
	109 TIMEDISPLAY_Frames
	110 TIMEDISPLAY_23976Timecode
	111 TIMEDISPLAY_16mmFeetFrames
	112 TIMEDISPLAY_35mmFeetFrames
	113 TIMEDISPLAY_48Timecode
	200 TIMEDISPLAY_AudioSamplesTimecode
	201 TIMEDISPLAY_AudioMsTimecode
	*/
	var error = false;

	// Determine the largest frame count in the last timecode segment
	var maxFrames = 0;
	var tcFragments, i;
	var delimiter = "*";

	if(tcArray[0].indexOf(";") > -1) delimiter = ";";
	else if(tcArray[0].indexOf(":") > -1) delimiter = ":";

	// Special strings and empty strings
	if(tcArray[0] == ":") tcArray[0] = "";
	if(tcArray[0] == ";") tcArray[0] = "";

	if(tcArray[0] != "")
		{
		for(i=0; i<tcArray.length; i++)
			{
			tcFragments = tcArray[i].split(delimiter);
			if(tcFragments.length < 4) throw { type: "timecode", message: "Unknown timecode format." };
			else if(tcFragments[3].length == 1) throw { type: "timecode", message: "Sorry, the timecode format of the CSV file is currently not supported (probably 10fps or less)." };
			else if(tcFragments[3].length == 5) throw { type: "timecode", message: "Sorry, timecode with audio samples is currently not supported. Use milliseconds instead." };
			else if(tcFragments[3].length > 2) throw { type: "timecode", message: "Unknown timecode format." };
			if(tcFragments[3] > maxFrames) maxFrames = tcFragments[3];
			}
		}

	// Try to find a timecode mismatch between CSV file and active sequence
	if(tcFormat == 100 && maxFrames > 23) error = true;
	else if(tcFormat == 101 && maxFrames > 24) error = true;
	else if(tcFormat == 102 && maxFrames > 29) error = true;
	else if(tcFormat == 103 && maxFrames > 29) error = true;
	else if(tcFormat == 104 && maxFrames > 29) error = true;
	else if(tcFormat == 105 && maxFrames > 49) error = true;
	else if(tcFormat == 106 && maxFrames > 59) error = true;
	else if(tcFormat == 107 && maxFrames > 59) error = true;
	else if(tcFormat == 108 && maxFrames > 59) error = true;
	else if(tcFormat == 110 && maxFrames > 23) error = true;
	else if(tcFormat == 113 && maxFrames > 47) error = true;
	else if(delimiter == ";" && tcFormat != 102 && tcFormat != 106) error = true;
	else if(delimiter == ":" && (tcFormat == 102 || tcFormat == 106)) error = true;

	if(error) throw { type: "timecode", message: "The timecode format of the CSV file doesn't match the timecode format of your active sequence." };

	// Now let's convert the timecode to seconds
	var seconds, minutes, framesDropped, framesNotDropped, frameCorrection, timeCorrection;
	var nondropFactor = 1;
	if(tcFormat == 102 || tcFormat == 103) nondropFactor = 30 / 29.97;
	else if(tcFormat == 106 || tcFormat == 107) nondropFactor = 60 / 59.94;
	else if(tcFormat == 110) nondropFactor = 24 / 23.976;


	for(i=0; i<tcArray.length; i++)
		{
		seconds = 0;
		if(String(tcArray[i]).trim() != "")
			{
			tcFragments = tcArray[i].split(delimiter);
			// hours
			seconds += parseInt(tcFragments[0]) * 3600 * nondropFactor;
			// minutes
			seconds += parseInt(tcFragments[1]) * 60 * nondropFactor;
			// seconds
			seconds += parseInt(tcFragments[2]) * nondropFactor;
			// images
			tcFragments[3] = parseInt(tcFragments[3]);
			if(tcFormat == 100) seconds += tcFragments[3] / 24;
			else if(tcFormat == 101) seconds += tcFragments[3] / 25;
			else if(tcFormat == 102) seconds += tcFragments[3] / 29.97;
			else if(tcFormat == 103) seconds += tcFragments[3] / 29.97;
			else if(tcFormat == 104) seconds += tcFragments[3] / 30;
			else if(tcFormat == 105) seconds += tcFragments[3] / 50;
			else if(tcFormat == 106) seconds += tcFragments[3] / 59.94;
			else if(tcFormat == 107) seconds += tcFragments[3] / 59.94;
			else if(tcFormat == 108) seconds += tcFragments[3] / 60;
			else if(tcFormat == 110) seconds += tcFragments[3] / 23.976;
			else if(tcFormat == 113) seconds += tcFragments[3] / 48;
			else throw { type:"timecode", message: "Unknown timecode format in your active sequence." };

			// Correct the times on drop-frame timecodes
			// https://blog.frame.io/2017/07/17/timecode-and-frame-rates/
			if(tcFormat == 102)
				{
				// Drop 2 Frames every minute, but not every 10th minute
				// Done in little steps to keep a better overview
				minutes =  parseInt(tcFragments[1]) + parseInt(tcFragments[0]) * 60;
				framesDropped = minutes * 2;
				framesNotDropped = Math.floor(minutes/10) * 2;
				frameCorrection = framesDropped - framesNotDropped;
				timeCorrection = frameCorrection * nondropFactor / 30;
				seconds -= timeCorrection;
				}
			else if(tcFormat == 106)
				{
				// Drop 4 Frames every minute, but not every 10th minute
				// Done in little steps to keep a better overview
				minutes =  parseInt(tcFragments[1]) + parseInt(tcFragments[0]) * 60;
				framesDropped = minutes * 4;
				framesNotDropped = Math.floor(minutes/10) * 4;
				frameCorrection = framesDropped - framesNotDropped;
				timeCorrection = frameCorrection * nondropFactor / 30;
				seconds -= timeCorrection;
				}
			}
		tcArray[i] = seconds;
		}

	return tcArray;
	}



function time_to_seconds(tcArray, delimiter=":")
	{
	for(var i=0; i<tcArray.length; i++)
		{
		seconds = 0;
		if(String(tcArray[i]).trim() != "")
			{
			tcFragments = tcArray[i].split(delimiter);
			if(tcFragments.length == 3)
				{
				seconds += parseInt(tcFragments[0]) * 3600;
				seconds += parseInt(tcFragments[1]) * 60;
				seconds += parseFloat(tcFragments[2]);
				}
			else if(tcFragments.length == 2)
				{
				seconds += parseInt(tcFragments[0]) * 60;
				seconds += parseFloat(tcFragments[1]);
				}
			else if(tcFragments.length == 1)
				{
				seconds += parseFloat(tcFragments[0]);
				}
			else throw { type:"timecode", message: "Your data contain an invalid time format (" + tcArray[i] + ")" };
			}
		tcArray[i] = seconds;
		}
	return tcArray;
	}



function delay(ms)
	{
 	var start = new Date().getTime();
 	var end = start;
 	while((end-start) < ms) end = new Date().getTime();
	}



function fix_sequoia_times(t)
	{
	t = t.replace(/\./g, "");
	t = t.replace(/ ms/g, "");
	t = parseFloat(t) / 1000;
	return t;
	}



function errorcode_to_text(code)
	{
	if(code == window.cep.fs.NO_ERROR) return "no error";
	if(code == window.cep.fs.ERR_UNKNOWN) return "unknown error";
	if(code == window.cep.fs.ERR_INVALID_PARAMS) return "invalid params";
	if(code == window.cep.fs.ERR_NOT_FOUND) return "file not found";
	if(code == window.cep.fs.ERR_CANT_READ) return "cannot read";
	if(code == window.cep.fs.ERR_UNSUPPORTED_ENCODING) return "unsupported encoding";
	return "error text unknown";
	}



function csv_to_array(csvString, delimiter, keep=false)
	{
	/*
	This function walks through the entire CSV content, character by character,
	and puts all the cell values into a 2-dimensional array.
	It can process quotes around cell values and understands double quotes "" as part of the cell value.
	Attention: The resulting array of array is an array of columns, not an array of rows!
	*/
	var data = [];
	var cellRow = 0;
	var cellCol = 0;
	var cellStr = "";
	var thisChr = "";
	var hasQuot = false;
	var newCell = true;
	var i=0;
	var err = false;

	// Helper function
	function add_cell_to_array()
		{
		if (data[cellCol] == undefined) data[cellCol] = [];
		data[cellCol][cellRow] = cellStr;
		newCell = true;
		cellCol++;
		}

	// Walk through the entire string
	for (i=0; i<csvString.length; i++)
		{
		// New cell: Reset values and check for quotes
		if (newCell)
			{
			newCell = false;
			cellStr ="";
			hasQuot = (csvString[i] == '"');
			if(hasQuot && keep)
				{
				cellStr +='"';
				i++;
				}
			else if(hasQuot) i++;
			}

		// Get the current character
		thisChr = csvString[i];

		// End of cell
		if (!hasQuot && thisChr == delimiter) add_cell_to_array();

		// End of line
		else if (!hasQuot && thisChr == "\n")
			{
			add_cell_to_array();
			cellRow++;
			cellCol = 0;
			}

		// End of file (do this in case there is no \n at the end of the file)
		else if (!hasQuot && i == csvString.length-1)
			{
			cellStr += thisChr;
			add_cell_to_array();
			cellRow++;
			cellCol = 0;
			}

		// Handle quotes
		else if (hasQuot && thisChr == '"')
			{
			// Double quotes? Convert to single quote
			if (i+1 < csvString.length && csvString[i+1] == '"')
				{
				i++;
				if(keep) cellStr += '""';
				else cellStr += '"';
				}
			else if(keep)
				{
				cellStr += '"';
				hasQuot = false;
				}
			// Else add nothing and close the quotes
			else hasQuot = false;
			}

		// Convert tabs to spaces
		else if (hasQuot && thisChr == '\t')
			{
			cellStr += ' ';
			}

		// Just add the character to the cell
		else cellStr += thisChr;
		}

	// Check whether all columns have the same length. If not return an empty array.
	if(data.length > 0)
		for(i=0; i<data.length; i++)
			if(data[i].length != data[0].length || !Array.isArray(data[i]))
				{
				err = true;
				}
	if(err) data = [];
	return data;
	}

function set_status(txt=null, ico=null)
	{
	if(txt == null) txt = standardStatus;
	if(ico == "loader") txt = '<img id="loader" src="img/markerbox-loader.svg" /> ' + txt;
	setTimeout('document.getElementById("statusbar").innerHTML = \'' + txt + '\';', 1);
	}

function backup_dropzone()
	{
	dropzoneBackup = dropzone.value;
	}

function clean_dropzone_input(dropStr)
	{
	// Deletes empty lines,
	// Determines the delimiter
	// Fills all lines with missing tabs in case tabs are the delimiter

	if(dropStr.trim() == "") return "";

	var RegEx, regResult, compResult, i, ii, tempArr, tempInt;

	// Split string into rows
	var dropArray = dropStr.split("\n");

	// Clean empty rows
	for(i=0; i<dropArray.length; i++) if(dropArray[i].trim() == "")
		{
		dropArray.splice(i,1);
		i--;
		}

	// Identify the delimiter

	// With the tab being the most likely delimiter, it will be chosen if there is only a single tab in the string
	var dlmtr = "";
	if(dropStr.indexOf("\t") > -1)
		{
		dlmtr = "\t";
		dropzoneDelimiter = "\t";

		// Fill all lines with the max amount of tabs
		var maxTabs = dropArray[0].split("\t").length;
		for(i=0; i<dropArray.length; i++) maxTabs = Math.max(maxTabs, dropArray[i].split("\t").length);
		var thisDiff = 0;
		for(i=0; i<dropArray.length; i++)
			{
			thisDiff = maxTabs - dropArray[i].split("\t").length;
			for(ii=0; ii<thisDiff; ii++) dropArray[i] += "\t";
			}
		return dropzone_array_to_string(dropArray);
		}

	// No tabs? Is this from a CSV file? Only accept ; as delimiter if all rows have the same count
	if(dlmtr == "")
		{
		dlmtr = ";";
		compResult = dropArray[0].replace(/".*"/g, "").split(";").length;
		for(i=0; i<dropArray.length; i++) if(compResult != dropArray[i].replace(/".*"/g, "").split(";").length) dlmtr = "";
		// Only if the data field is consistent (= same count of colons in all rows) accept the input
		// This simple routine will not work with additional colons in comments
		if(dlmtr == ";" && dropArray[0].indexOf(";") > -1)
			{
			dropzoneDelimiter = ";";
			return dropzone_array_to_string(dropArray);
			}
		dlmtr = "";
		}

	// No colons? Try the same thing with commas
	if(dlmtr == "")
		{
		dlmtr = ",";
		compResult = dropArray[0].replace(/".*"/g, "").split(",").length;
		for(i=0; i<dropArray.length; i++) if(compResult != dropArray[i].replace(/".*"/g, "").split(",").length) dlmtr = "";
		// Only if the data field is consistent (= same count of commas in all rows) accept the input
		// This simple routine will not work with additional commas in comments
		if(dlmtr == "," && dropArray[0].indexOf(",") > -1)
			{
			dropzoneDelimiter = ",";
			return dropzone_array_to_string(dropArray);
			}
		dlmtr = "";
		}

	// Still no colons? Try the same thing with empty spaces
	// From here on we must consider this to be a non-table input
	// So we assume a maximum of 3 columns: time1 time2 comment
	if(dlmtr == "")
		{
		var minSpaces = 1000;
		var maxSpaces = 0;
		for(i=0; i<dropArray.length; i++)
			{
			// Because we are checking for hyphens later convert special hyphen delimiters here first
			dropArray[i] = dropArray[i].replace(/[–—]/, "-");
			dropArray[i] = dropArray[i].replace(/s*-s*/, "-");
			dropArray[i] = dropArray[i].replace(/s*\/s*/, "-");
			dropArray[i] = dropArray[i].replace(/s*\|s*/, "-");

			tempInt = dropArray[i].split(" ",3).length-1;
			minSpaces = Math.min(minSpaces, tempInt);
			maxSpaces = Math.max(maxSpaces, tempInt);
			}
		// If maxSpaces == 2 and minSpaces == 0 the case cannot be resolved
		if(maxSpaces > 0 && maxSpaces - minSpaces < 2)
			{
			// We will convert everything to tabs so that it looks nicer in the drop zone
			dlmtr = "\t";
			dropzoneDelimiter = "\t";

			// Fill the array with spaces
			for(i=0; i<dropArray.length; i++)
				{
				tempArr = dropArray[i].split(" ");
				if(tempArr.length-1 < maxSpaces) tempArr[tempArr.length] = "\t";
				dropArray[i] = tempArr.join("\t");
				}
			}
		}

	// Even if empty space is a delimiter we could still have a second one between times
	if(dlmtr == "" || dlmtr == "\t")
		{
		var minHyph = 1000;
		var maxHyph = 0;
		for(i=0; i<dropArray.length; i++)
			{
			tempInt = dropArray[i].split("-",3).length-1;
			minHyph = Math.min(minHyph, tempInt);
			maxHyph = Math.max(maxHyph, tempInt);
			}
		// If maxHyph == 2 and minHyph == 0 the case cannot be resolved
		if(maxHyph - minHyph >= 2)
			{
			if(dlmtr == "") return "";
			else return dropzone_array_to_string(dropArray);
			}

		// In case there is no hyphen send the string back
		if(maxHyph == 0) return dropzone_array_to_string(dropArray);

		// Now we know there are hyphens, so lets fill the lines accordingly
		// This means we know maxHyph - minHyph == 1
		// But we wont set dropzoneDelimiter to hyphen. Instead we convert all hyphens to tabs
		dropzoneDelimiter = "\t";
		for(i=0; i<dropArray.length; i++)
			{
			tempArr = dropArray[i].split("-");
			if(tempArr.length-1 < maxHyph) tempArr[tempArr.length] = "\t";
			dropArray[i] = tempArr.join("\t");
			}
		}
	return dropzone_array_to_string(dropArray);
	}

function dropzone_array_to_string(lines)
	{
	// Deletes empty columns from the dropzone array and returns the whole thing as a string.
	if(lines == []) return "";

	var i, ii, empty;
	var str = lines.join("\n") + "\n";

	var arr = csv_to_array(str, dropzoneDelimiter, true);

	// Delete empty columns
	for(i=0; i<arr.length; i++)
		{
		empty = true;
		for(ii=0; ii<arr[i].length; ii++)
			{
			if(String(arr[i][ii]).trim() != "") empty = false;
			}
		if(empty)
			{
			arr.splice(i,1);
			i--;
			}
		}
	if(arr == []) return "";

	// Convert the array to a string
	var newArr = [];
	for(i=0; i<arr[0].length; i++) newArr[i] = arr[0][i];
	if(arr.length > 1)
		{
		for(i=0; i<arr[0].length; i++)
			{
			for(ii=1; ii<arr.length; ii++) newArr[i] += dropzoneDelimiter + arr[ii][i];
			}
		}
	return newArr.join("\n") + "\n";
	}

function preprocess_time(arr)
	{
	// This function cleans time values that group number by dot, comma or space
	// or that have units at the end like s, sec or ms
	// Milliseconds will be returned as seconds

	var str = arr[arr.length-1].toLowerCase();
	var msDelimiter = ".";

	// milliseconds
	if(str.indexOf("ms") > 0 && str.indexOf("ms") == str.length - 2)
		{
		for(i=0; i<arr.length; i++)
			{
			//if(i==arr.length-1) alert(arr[i]);
			arr[i] = String(arr[i]).replace(/\s*ms$/i, "");
			arr[i] = String(arr[i]).replace(/[,. ]/g, "");
			arr[i] = String(parseInt(arr[i]) / 1000);
			//if(i==arr.length-1) alert(arr[i]);
			}
		}

	// Seconds
	else if(str.indexOf("ms") > 0 && (str.indexOf("s") == str.length - 1 || str.indexOf("sec") == str.length - 3 || str.indexOf("secs") == str.length - 4 || str.indexOf("seconds") == str.length - 7 || str.indexOf("sek") == str.length - 3 || str.indexOf("sekunden") == str.length - 8))
		{
		// German format?
		for(i=0; i<arr.length; i++)
			if(String(arr[i]).lastIndexOf(",") > String(arr[i]).lastIndexOf(".")) msDelimiter = ",";
		for(i=0; i<arr.length; i++)
			{
			arr[i] = String(arr[i]).replace(/\s*s$|\s*secs?$|\s*seconds$|\s*sek$|\s*sekunden$/i, "");
			if(msDelimiter == ".") arr[i] = String(arr[i]).replace(/[, ]/g, "");
			else if(msDelimiter == ",") arr[i] = String(arr[i]).replace(/[. ]/g, "");
			}
		}

	return arr;
	}

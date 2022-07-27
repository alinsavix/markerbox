// This file contains the settings for the MARKERBOX extension of Adobe Premiere Pro.
// The PREF_ variables can be modified to meet your personal preferences.
//
// The double slash // marks comments. Everything else is code that will be executed.
// If you don't feel comfortable with editing Javascript check out http://markerbox.pro/howto
// 
// © 2021 by Tyron Montgomery
// Last modified on April 14, 2021





//---------- Importing data from text area ----------





// Standard color for the Screenlight markers in your Premiere sequence.
// 0 = green, 1 = red, 2 = rose, 3 = orange, 4 = yellow, 5 = white, 6 = blue, 7 = teal

PREF_TEXTAREA_MARKER_COLOR = 3;





// Standard marker type for the Sequoia markers in your Premiere sequence.
// Possible values are:  "Comment", "Chapter", "Segmentation", or "WebLink".

PREF_TEXTAREA_MARKER_TYPE = "Comment";





//---------- Importing CSV files from Screenlight ----------





// Standard color for the Screenlight markers in your Premiere sequence.
// 0 = green, 1 = red, 2 = rose, 3 = orange, 4 = yellow, 5 = white, 6 = blue, 7 = teal

PREF_SCREENLIGHT_MARKER_COLOR = 3;





// Standard marker type for the Sequoia markers in your Premiere sequence.
// Possible values are:  "Comment", "Chapter", "Segmentation", or "WebLink".

PREF_SCREENLIGHT_MARKER_TYPE = "Comment";





// Multi-color options:
//    _MODE = 0   One marker color only, as defined above
//    _MODE = 1   Markerbox will automatically assign different colors to different reviewers.
//                You can set the order of the colors in the _ORDER array.
//    _MODE = 2   Colors will be assigned according to the rules defined in the _RULES array of arrays below.
//                Add as many rules as you like.
//                Attention: You should really know what you are doing. Syntax errors will crash Markerbox.
//                Especially, make sure there is no comma after the last rule.

PREF_SCREENLIGHT_MULTICOLOR_MODE = 0; // Attention: Mode 1 not implemented yet!
PREF_SCREENLIGHT_AUTOCOLOR_ORDER = [ 7 , 6 , 5 , 4 , 3 , 2 , 1 , 0 ];
PREF_SCREENLIGHT_MULTICOLOR_RULES =
   [
// [Name begins with, color number, marker type]
   ["John Doe", 3, "Comment"],
   ["John Smith", 6, "Comment"],
   ["Maria", 0, "Comment"]
   ];





//---------- Importing CSV files from Vimeo ----------





// Standard color for the Sequoia markers in your Premiere sequence.
// 0 = green, 1 = red, 2 = rose, 3 = orange, 4 = yellow, 5 = white, 6 = blue, 7 = teal

PREF_VIMEO_MARKER_COLOR = 3;





// Standard marker type for the Sequoia markers in your Premiere sequence.
// Possible values are: "Comment", "Chapter", "Segmentation", or "WebLink".

PREF_VIMEO_MARKER_TYPE = "Comment";





// Multi-color options:
//    _MODE = 0   One marker color only, as defined above
//    _MODE = 1   Markerbox will automatically assign different colors to different edit names.
//                You can set the order of the colors in the _ORDER array.
//    _MODE = 2   Colors will be assigned according to the rules defined in the _RULES array of arrays below.
//                Add as many rules as you like.
//                Attention: You should really know what you are doing. Syntax errors will crash Markerbox.
//                Especially, make sure there is no comma after the last rule.
//    _MODE = 3   Standard color for all markers and second color (see below) for those marked as resolved.
//    _MODE = 4   A combination of mode 2 and 3:
//                Markers will be colored via the rules and resolved comments will have a separate color.

PREF_VIMEO_MULTICOLOR_MODE = 3; // Attention: Mode 1 not implemented yet!
PREF_VIMEO_AUTOCOLOR_ORDER = [ 7 , 6 , 5 , 4 , 3 , 2 , 1 , 0 ];
PREF_VIMEO_MULTICOLOR_RULES =
   [
// [Name begins with, color number, marker type]
   ["John Doe", 3, "Comment"],
   ["John Smith", 6, "Comment"],
   ["Maria", 0, "Comment"]
   ];





// Settings for resolved issues. Set _HIDE = 1 to hide resolved comments altogether.
// Settings for standard color and type require _MODE = 3 above.

PREF_VIMEO_RESOLVED_HIDE = 0;
PREF_VIMEO_RESOLVED_COLOR = 6;
PREF_VIMEO_RESOLVED_TYPE = "Comment";





// If set to 0 all answers will appear as separate markers with the same timecode as the initial comment
// If set to 1 all answers will be merged into the initial comment, preserving the name of the reviewer

PREF_VIMEO_MERGE_ANSWERS = 1;





//---------- Importing CSV files from Sequoia ----------





// Track to import markers from.
// Sequoia exports the markers of all tracks of the audio mix.
// If you choose a higher track number make sure it exists in your CSV file.

PREF_SEQUOIA_IMPORT_TRACK = 1;





// Standard color for the Sequoia markers in your Premiere sequence.
// 0 = green, 1 = red, 2 = rose, 3 = orange, 4 = yellow, 5 = white, 6 = blue, 7 = teal

PREF_SEQUOIA_MARKER_COLOR = 3;





// Standard marker type for the Sequoia markers in your Premiere sequence.
// Possible values are: "Comment", "Chapter", "Segmentation", or "WebLink".

PREF_SEQUOIA_MARKER_TYPE = "Segmentation";





// Multi-color options:
//    _MODE = 0   One marker color only, as defined above
//    _MODE = 1   Markerbox will automatically assign different colors to different edit names.
//                You can set the order of the colors in the _ORDER array.
//    _MODE = 2   Colors will be assigned according to the rules defined in the _RULES array of arrays below.
//                Add as many rules as you like.
//                Attention: You should really know what you are doing. Syntax errors will crash Markerbox.
//                Especially, make sure there is no comma after the last rule.

PREF_SEQUOIA_MULTICOLOR_MODE = 2; // Attention: Mode 1 not implemented yet!
PREF_SEQUOIA_AUTOCOLOR_ORDER = [ 0 , 1 , 2 , 3 , 4 , 5 , 6 , 7 ];
PREF_SEQUOIA_MULTICOLOR_RULES =
   [
// [Name begins with, color number, marker type]
   ["Concert 1", 3, "Segmentation"],
   ["Concert 2", 6, "Segmentation"],
   ["Rehearsal", 0, "Segmentation"]
   ];





// Other settings.
SETTINGS_MAC_ERROR3 = 0;





// End of settings. Do not change the following lines of code.
SETTINGS_VERSION = 8002;
SETTINGS = "ok";

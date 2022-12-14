/*

This script performs all the Premiere-specific ExtendScript actions of the MARKERBOX extension.

© 2021 by Tyron Montgomery
Last modified on April 14, 2021

*/

var console = console || {};

console.log = function (message) {

    $.writeln(message);

};

$.markerboxPanel =
{
    get_sequence_timecode_format: function () {
        if (app.project.activeSequence == null) {
            alert("There seems to be no active sequence in your project.\nWithout an active sequence there's nothing I can do.", "ERROR", true);
            return "error";
        }
        var timecodeFormat = parseFloat(app.project.activeSequence.videoDisplayFormat);
        if (timecodeFormat < 100 || timecodeFormat > 201) {
            alert("Your active sequence seems to have an unsupported timecode format (" + timecodeFormat + ").\nMarkers cannot be imported.", "ERROR", true);
            return "error";
        }
        return timecodeFormat;
    },

    // get_sequence_timecode_format: function () {
    //     if (app.project.activeSequence == null) {
    //         alert("There seems to be no active sequence in your project.\nWithout an active sequence there's nothing I can do.", "ERROR", true);
    //         return "error";
    //     }
    //     var timecodeFormat = parseFloat(app.project.activeSequence.videoDisplayFormat);
    //     // if (timecodeFormat < 100 || timecodeFormat > 201) {
    //     //     alert("Your active sequence seems to have an unsupported timecode format.\nMarkers cannot be imported.", "ERROR", true);
    //     //     return "error";
    //     // }
    //     return timecodeFormat;
    // },

    // set_sequence_timecode_format: function (timecodeFormat) {
    //     if (app.project.activeSequence == null) {
    //         alert("There seems to be no active sequence in your project.\nWithout an active sequence there's nothing I can do.", "ERROR", true);
    //         return "error";
    //     }

    //     var currentSettings = app.project.activeSequence.getSettings();
    //     currentSettings.videoDisplayFormat = timecodeFormat + 1;
    //     app.project.activeSequence.setSettings(currentSettings);

    //     return timecodeFormat;
    // },

    delete_all_sequence_markers: function () {
        app.enableQE();
        if (app.project.activeSequence == null) {
            alert("There seems to be no active sequence in your project.\nNo sequence, no markers to delete.", "ERROR", true);
            return "error";
        }
        if (app.project.activeSequence.markers == null) {
            alert("Cannot read markers from active sequence.\nThis is a very unusual error.\nPlease get in touch with the development team or Markerbox.", "ERROR", true);
            return "error";
        }
        var response = delete_all_markers(app.project.activeSequence.markers);
        if (response == 0) alert("There are no markers\nin your active sequence.", "ERROR", true);
        else if (response == 1) alert("One marker was deleted\nfrom your active sequence.", "MARKERBOX", false);
        else alert(response + " markers have been deleted\nfrom your active sequence.", "MARKERBOX", false);
    },

    xfer_sequence_markers: function () {
        app.enableQE();
        if (app.project.activeSequence == null) {
            alert("There seems to be no active sequence in your project.\nNo sequence, no markers to delete.", "ERROR", true);
            return "error";
        }
        if (app.project.activeSequence.markers == null) {
            alert("Cannot read markers from active sequence.\nThis is a very unusual error.\nPlease get in touch with the development team or Markerbox.", "ERROR", true);
            return "error";
        }
        var response = delete_all_markers(app.project.activeSequence.markers);
        if (response == 0) alert("There are no markers\nin your active sequence.", "ERROR", true);
        else if (response == 1) alert("One marker was deleted\nfrom your active sequence.", "MARKERBOX", false);
        else alert(response + " markers have been deleted\nfrom your active sequence.", "MARKERBOX", false);
    },

    create_sequence_markers: function (markerData) {
        if (app.project.activeSequence == null) {
            alert("There seems to be no active sequence in your project.\nNo sequence, no place to create markers.", "ERROR", true);
            return "error";
        }
        if (app.project.activeSequence.markers == null) {
            alert("Cannot read markers from active sequence.\nThis is a very unusual error.\nPlease get in touch with the development team or Markerbox.", "ERROR", true);
            return "error";
        }
        var response = create_markers(app.project.activeSequence.markers, markerData);
        if (response == "error data") {
            alert("There was a problem with the CSV data.\nIf the CSV file was edited manually\nplease check its content thoroughly.", "ERROR", true);
            return "error";
        }
        else if (response == 0) alert("The import went well, but no marker was created.\nIt seems your CSV file didn't contain any data.", "ERROR", true);
        else if (response == 1) alert("One marker was created\nin your active sequence.", "MARKERBOX", false);
        else alert(response + " markers have been created\nin your active sequence.", "MARKERBOX", false);
    },

    create_clip_markers: function (markerData) {

        var selectedItems = app.getCurrentProjectViewSelection();
        if (!selectedItems) {
            alert("No project items are selected, so no place to create markers");
            return "error";
        }

        if (selectedItems.length != 1) {
            alert("More than one project item selected, so not sure where to create markers");
            return "error";
        }

        projectItem = selectedItems[0];

        if (projectItem.type != ProjectItemType.CLIP && projectItem.type != ProjectItemType.FILE) {
            alert("Selected project item is not a clip or file.", "ERROR", true);
            return "error";
        }

        /*
        if (app.project.rootItem.children.numItems == 0) {
            alert("Project is empty, no place to create markers.", "ERROR", true);
            return "error";
        }
        var projectItem = app.project.rootItem.children[0];
        if (!projectItem) {
            alert("Could not find first projectItem.", "ERROR", true);
            return "error";
        }
        if (projectItem.type != ProjectItemType.CLIP && projectItem.type != ProjectItemType.FILE) {
            alert("First projectItem is not a clip or file.", "ERROR", true);
            return "error";
        }
        */
        markers = projectItem.getMarkers();

        if (app.project.activeSequence.markers == null) {
            alert("Couldn't read markers from selected item.", "ERROR", true);
            return "error";
        }
        var response = create_markers(markers, markerData);
        if (response == "error data") {
            alert("There was a problem with the CSV data.\nIf the CSV file was edited manually\nplease check its content thoroughly.", "ERROR", true);
            return "error";
        }
        else if (response == 0) alert("The import went well, but no marker was created.\nIt seems your CSV file didn't contain any data.", "ERROR", true);
        else if (response == 1) alert("One marker was created\nin your selected project item.", "MARKERBOX", false);
        else alert(response + " markers have been created\nin your selected project item.", "MARKERBOX", false);
    },

    alertbox: function (arr) {
        var strMessage = arr[0];
        var strTitle = arr[1];
        var boolSymbol = arr[2];
        alert(strMessage, strTitle, boolSymbol);
    },

    confirmbox: function (str) {
        return confirm(str, true, "MARKERBOX");
    }
};




function delete_all_markers(markerGroup) {
    var deleted = 0;
    var firstMarker = markerGroup.getFirstMarker();
    while (firstMarker) {
        markerGroup.deleteMarker(firstMarker);
        deleted++;
        firstMarker = markerGroup.getFirstMarker();
    }
    return deleted;
};



function create_markers(markerGroup, markerData) {
    var i, thisTime, thisMarker, markerCount;

    if (markerData.times instanceof Array) markerCount = markerData.times.length;
    else return "error data";

    var markersCreated = 0;
    for (i = 0; i < markerData.times.length; i++) {
        thisTime = markerData.times[i];
        thisMarker = markerGroup.createMarker(thisTime);

        if (markerData.names instanceof Array && markerData.names.length > i) thisMarker.name = markerData.names[i];

        if (markerData.ends instanceof Array && markerData.ends.length > i) thisMarker.end = markerData.ends[i];
        else if (markerData.durations instanceof Array && markerData.durations.length > i && markerData.durations[i] > 0)
            thisMarker.end = thisTime + markerData.durations[i];

        if (markerData.comments instanceof Array && markerData.comments.length > i) thisMarker.comments = markerData.comments[i];

        if (markerData.colors instanceof Array && markerData.colors.length > i) thisMarker.setColorByIndex(markerData.colors[i]);

        if (markerData.types instanceof Array && markerData.types.length > i) {
            if (markerData.types[i] == "Chapter") thisMarker.setTypeAsChapter();
            else if (markerData.types[i] == "Segmentation") thisMarker.setTypeAsSegmentation();
            else if (markerData.types[i] == "WebLink") thisMarker.setTypeAsWebLink();
            else thisMarker.setTypeAsComment();
        }
        else thisMarker.setTypeAsComment();
        markersCreated++;
    }
    return markersCreated;
};

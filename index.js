let alerts = false; //TODO: implement alerts and use document.querySelector('#optionsForm').alerts.checked
let alertTime = 0;
var calendarFile = null;

// Enable all tooltips
const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))

function selectCalendarFile(selectedFile) {
  calendarFile = selectedFile;
  document.querySelector('#fileUploadLabel').innerText = `📄 ${selectedFile.name}`;
}

function handleCalendarFile(selectedFile) {
  return new Promise((resolve) => {
    var reader = new FileReader();

    reader.onloadend = function(event) {
      resolve(parseContent(event.target.result));
    };

    reader.readAsText(selectedFile);
  });
}

function onFileSelected(event) {
  selectCalendarFile(event.target.files[0]);
}

['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
  window.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
  });
});

window.addEventListener('drop', (e) => {
  selectCalendarFile(e.dataTransfer.files[0]);
});

function parseContent(input) {
  // Find blob in html file
  var result = input.match(/JSON\.parse\(\"(\[\{[\s\S]*\}\])\"\)/);

  try {
    if (!result || result.length < 2)
      throw new Error("No json blob found.");

    var cleanText = JSON.parse('"' + result[1] + '"');
    var json = JSON.parse(cleanText);

    return createCalendar(json);
  } catch (e) {
    return null;
  }
}

function generateSubject(type, module) {
  output = "";

  if (document.querySelector('#optionsForm').emojis.checked) {
    emojis = {"Practical":"\u{1F468}\u{200D}\u{1F4BB}", "Tutorial": "\u{1F468}\u{200D}\u{1F4BB}", "Lecture": "\u{1F393}", "Drop-In Class": "\u2B07\uFE0F", "Online Lecture":"\u{1F310}", "Online Computer Class": "\u{1F310}", "Seminar":"\u23F3"};
    if (type in emojis)
      output += emojis[type];
    else {
      console.log(type + " is an unknown type of class. Contact the maintainer to allocate an emoji.");
      output += "\u2753";
    }

    output += ' ';
  }
  else {
    shortened = {"Drop-In Class": "Drop-In", "Online Computer Class": "Online Computer Class"};
    if (type in shortened)
      output += shortened[type];
    else
      output += type;

    output += ' - ';
  }

  output += module;

  return output;
}

function createCalendar(input) {
  let cal = ics();
  
  input.forEach(e => {
      if (e["location"] != null) {
        latitude = e["location"]["building"]["latitude"];
        longitude = e["location"]["building"]["longitude"];
        roomNumber = e["location"]["name"].replace("D/","");
        buildingName = e["location"]["building"]["name"].replace("B/","");
        eventLocation = roomNumber + " - " + buildingName;
      }
      else {
        eventLocation = "Unknown location";
      }

      if ((e.type == "Online Lecture" || e.type == "Online Computer Class") && eventLocation == "Unknown location") {
        eventLocation = "Online";
      }

      eventSubject = generateSubject(e.type, e.description);

      eventDescription = e.module.name;
      if (e.staff && e.staff.length > 0 && e.staff[0].name) {
        eventDescription += "\\nLecturer: " + e.staff[0].name;
        eventDescription += "\\nEmail: " + e.staff[0].email;
      }

      if (e?.location_link) {
        try {
          eventDescription += "\\n\\nMaps Link: " + e.location_link.match(/href="([\S]*)"/)[1];
        }
        catch {
          console.error("Getting google maps url failed");
        }
      }

      cal.addEvent(eventSubject, eventDescription, eventLocation, e.start_datetime.replace(' ', 'T'), e.end_datetime.replace(' ', 'T'));
  });

  return cal;
}

function downloadCalendar() {
  if (!calendarFile) {
    alert('Error: no file chosen.');
  } else {
    handleCalendarFile(calendarFile).then((cal) => {
      try {
        if (!cal) {
          throw new Error('Failed to get calendar info from HTML.');
        }
        cal.download('myTimetable');
      } catch (e) {
        alert(e); //TODO: better error handling
      }
    });
  }
}


// You can use this for easy debugging
makelogs = function(obj) {
  console.log('Events Array');
  console.log('=================');
  console.log(obj.events());
  console.log('Calendar With Header');
  console.log('=================');
  console.log(obj.calendar());
}

function hashChanged() {
  const navigatorPlatform = () => {
    if (/Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
      return 'android';
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent))
      return 'ios';
    return 'pc';
  };
  
  let platform;
  if (window.location.hash?.length < 2) {
    platform = navigatorPlatform();
  } else {
    platform = window.location.hash.substring(1);
  }
  document.querySelector('.selected[data-platform-opt]')?.classList?.remove('selected');
  document.querySelector(`[data-platform-opt="${platform}"]`).classList.add('selected');

  document.querySelector('.selected[data-instructions-platform]')?.classList?.remove('selected');
  document.querySelector(`[data-instructions-platform="${platform}"]`).classList.add('selected');
}

/**
 * Copy a string to clipboard
 * @param  {String} string         The string to be copied to clipboard
 * @return {Boolean}               returns a boolean correspondent to the success of the copy operation.
 * @see https://stackoverflow.com/a/53951634/938822
 */
 function copyToClipboard(string) {
  let textarea;
  let result;

  try {
    textarea = document.createElement('textarea');
    textarea.setAttribute('readonly', true);
    textarea.setAttribute('contenteditable', true);
    textarea.style.position = 'fixed'; // prevent scroll from jumping to the bottom when focus is set.
    textarea.value = string;

    document.body.appendChild(textarea);

    textarea.focus();
    textarea.select();

    const range = document.createRange();
    range.selectNodeContents(textarea);

    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    textarea.setSelectionRange(0, textarea.value.length);
    result = document.execCommand('copy');
  } catch (err) {
    console.error(err);
    result = null;
  } finally {
    document.body.removeChild(textarea);
  }

  // manual copy fallback using prompt
  if (!result) {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const copyHotkey = isMac ? '⌘C' : 'CTRL+C';
    result = prompt(`Press ${copyHotkey}`, string);
    if (!result) {
      return false;
    }
  }
  return true;
}
function copyBookmarklet() {
  copyToClipboard(`javascript:!function(){let e=document.documentElement.innerHTML;var t=document.createElement("a");t.setAttribute("href","data:text/plain;charset=utf-8,"+encodeURIComponent(e)),t.setAttribute("download",\`\${document.title}.html\`),t.style.display="none",document.body.appendChild(t),t.click(),document.body.removeChild(t)}();`);
  alert('Copied to clipboard.');
}

addEventListener('hashchange', hashChanged);
addEventListener('DOMContentLoaded', () => {
  hashChanged();
});

let emoji = true;
let alerts = false;
let alertTime = 0;

function onFileSelected(event) {
  var selectedFile = event.target.files[0];
  document.querySelector('#fileUploadLabel').innerText = `📄 ${selectedFile.name}`;

  var reader = new FileReader();

  reader.onloadend = function(event) {
    parseContent(event.target.result);
  };

  reader.readAsText(selectedFile);
}

function parseContent(input) {
  // Find blob in html file
  var result = input.match(/JSON\.parse\(\"(\[\{[\s\S]*\}\])\"\)/);

  if (result.length > 1) {
    var cleanText = JSON.parse('"' + result[1] + '"');
    var json = JSON.parse(cleanText);
    try {
      createCalendar(json);
    } catch (e) {
      alert(e); //TODO: better error handling
    }
  }
}

function generateSubject(type, module) {
  output = "";

  if (emoji) {
    emojis = {"Practical":"\u{1F468}\u{200D}\u{1F4BB}", "Tutorial": "\u{1F468}\u{200D}\u{1F4BB}", "Lecture": "\u{1F393}", "Drop-In Class": "\u2B07\uFE0F", "Online Lecture":"\u{1F310}", "Online Computer Class": "\u{1F310}", "Seminar":"\u23F3"};
    if (type in emojis)
      output += emojis[type];
    else {
      console.log(type + " is an unknown type of class. Contact the maintainer to allocate an emoji.");
      output += "❓";
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
  cal = ics();
  
  input.forEach(e => {
      if (e["location"] != null) {
        latitude = e["location"]["building"]["latitude"];
        longitude = e["location"]["building"]["longitude"];
        eventLocation = e["location"]["name"] + ", " + e["location"]["building"]["name"];
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

      cal.addEvent(eventSubject, eventDescription, eventLocation, e.start_datetime.replace(' ', 'T'), e.end_datetime.replace(' ', 'T'));
  });
}

function downloadCalendar() {
  try {
    cal.download('myTimetable');
  } catch (e) {
    alert(e); //TODO: better error handling
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
  const isMobileDevice = () => {
    return !!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  let platform = "ios";
  if (window.location.hash?.length < 2) {
    platform = isMobileDevice() ? 'ios' : 'pc';
  } else {
    platform = window.location.hash.substring(1);
  }
  document.querySelector('.selected[data-platform-opt]')?.classList?.remove('selected');
  document.querySelector(`[data-platform-opt="${platform}"]`).classList.add('selected');

  document.querySelector('.selected[data-instructions-platform]')?.classList?.remove('selected');
  document.querySelector(`[data-instructions-platform="${platform}"]`).classList.add('selected');
}

addEventListener('hashchange', hashChanged);
addEventListener('DOMContentLoaded', () => {
  hashChanged();
});

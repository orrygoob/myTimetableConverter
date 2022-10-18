let emoji = true;

function onFileSelected(event) {
  console.log("file selected");
  var selectedFile = event.target.files[0];
  var reader = new FileReader();

  reader.onloadend = function(event) {
    parseContent(event.target.result);
  };

  reader.readAsText(selectedFile);
}

function parseContent(input) {
  // Find blob in html file
  var result = input.match(/\[\{[\s\S]*\]/);

  if (result.length > 0) {
    var cleanText = JSON.parse('"' + result[0] + '"');
    var json = JSON.parse(cleanText);
    createCalendar(json);
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
      console.log(e);

      eventDescription = e.module.name;
      if (e.staff && e.staff.length > 0 && e.staff[0].name) {
        eventDescription += "\\nLecturer: " + e.staff[0].name;
        eventDescription += "\\nEmail: " + e.staff[0].email;
      }

      cal.addEvent(eventSubject, eventDescription, eventLocation, e.start_datetime, e.end_datetime);
  });
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

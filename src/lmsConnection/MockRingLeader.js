import {ACTIVITY_PROGRESS, HOMEWORK_PROGRESS, ROLE_TYPES} from "../app/constants";


const getAsyncSpecs = () => {
  const isMockFailureResult = window.isMockingFailures ? Boolean(Math.random() * 20 < 1) : false;
  return ({isMockFailureResult, mockDuration: (Math.random() * 3000) + 250})
}



export const mockHasValidSession = () => window.isDevMode;

export const mockSubmitResourceSelection = (submissionContentItem) => new Promise(function (resolve, reject) {
  const {isMockFailureResult, mockDuration} = getAsyncSpecs();

  // const fakeFormScript = `
  //   <form id="ltijs_submit"
  //     style="display: none;"
  //     action="platform.deepLinkingSettings.deep_link_return_url"
  //     method="POST">
  //       <input type="hidden" name="JWT" value="message" />
  //   </form>
  //   <script>
  //   document.getElementById("ltijs_submit").submit()
  //   </script>;
  // `;

  // console.log('got result of ', dataResult);
  // let scriptElem = document.createElement('div');
  // scriptElem.innerHTML = dataResult;
  // document.body.appendChild(scriptElem);
  // const fakeForm = `
  //   <form id='ltijs_submit' style:"display:none">
  //     <input type="hidden" name="JWT" value="fakeVals" />
  //   </form>
  //   <script>
  //     // document.getElementById("ltijs_submit").submit()
  //     console.log("running fake form submission script");
  //     // window.location.replace("http://www.w3schools.com");
  //   </script>
  // `

  if (isMockFailureResult) {
    setTimeout(() => reject(new Error("====> MOCK ERROR triggered by MOCKED mockGetResourceId()")), mockDuration);
  } else {
    // Generate a fake resource id between 100 to 999
    // let resId = `resource-${Math.floor(Math.random() * (899) + 100)}`;
    setTimeout(() => resolve('fakeForm', mockDuration));
  }
});




export const mockGetUsers = (courseId) => new Promise(function (resolve, reject) {
  const {isMockFailureResult, mockDuration} = getAsyncSpecs();

  if (isMockFailureResult) {
    setTimeout(() => reject(new Error("====> MOCK ERROR triggered by MOCKED mockGetUsers()")), mockDuration);
  } else {
    // We now take the results we expect from LMS and further message the data to fit our data model format
    let users = JSON.parse(localStorage.getItem(`boiler-course-users-${courseId}`));
    setTimeout(() => resolve(users, mockDuration));
  }
});


export const mockGetAssignedStudents = (courseId) => new Promise(function (resolve, reject) {
  const {isMockFailureResult, mockDuration} = getAsyncSpecs();

  if (isMockFailureResult) {
    setTimeout(() => reject(new Error("====> MOCK ERROR triggered by MOCKED mockGetAssignedStudents()")), mockDuration);
  } else {
    // We now take the results we expect from LMS and further message the data to fit our data model format
    let users = JSON.parse(localStorage.getItem(`boiler-course-users-${courseId}`));
    let unenrolledStudentIds = new Set(JSON.parse(localStorage.getItem(`boiler-course-unenrolled-${courseId}`)));
    let students = users.filter(u => !unenrolledStudentIds.has(u.id) && u.roles.indexOf(ROLE_TYPES.instructor) < 0);
    setTimeout(() => resolve(students, mockDuration));
  }
});


export const mockGetUnassignedStudents = (courseId) => new Promise(function (resolve, reject) {
  const {isMockFailureResult, mockDuration} = getAsyncSpecs();

  if (isMockFailureResult) {
    setTimeout(() => reject(new Error("====> MOCK ERROR triggered by MOCKED mockGetAssignedStudents()")), mockDuration);
  } else {
    // We now take the results we expect from LMS and further message the data to fit our data model format
    let users = JSON.parse(localStorage.getItem(`boiler-course-users-${courseId}`));
    let unenrolledStudentIds = new Set(JSON.parse(localStorage.getItem(`boiler-course-unenrolled-${courseId}`)));
    let students = users.filter(u => unenrolledStudentIds.has(u.id) && u.roles.indexOf(ROLE_TYPES.instructor) < 0);
    setTimeout(() => resolve(students, mockDuration));
  }
});



export const mockGetStudentGrade = (assignmentId, studentId) => new Promise(function (resolve, reject) {
  const {isMockFailureResult, mockDuration} = getAsyncSpecs();

  const userGrades = JSON.parse(localStorage.getItem(`boiler-scores-${assignmentId}`));
  let theGrade = userGrades?.find(g => g.studentId === studentId);

  if (isMockFailureResult) {
    setTimeout(() => reject(new Error("====> MOCK ERROR triggered by mockGetStudentGrade()")), mockDuration);
  } else {
    setTimeout(() => resolve(theGrade, mockDuration));
  }
});


export const mockGetGrades = (assignmentId) => new Promise(function (resolve, reject) {
  const {isMockFailureResult, mockDuration} = getAsyncSpecs();

  let userGrades = JSON.parse(localStorage.getItem(`boiler-scores-${assignmentId}`));
  if (!userGrades) userGrades = [];

  if (isMockFailureResult) {
    setTimeout(() => reject(new Error("====> MOCK ERROR triggered by mockGetStudentGrade()")), mockDuration);
  } else {
    setTimeout(() => resolve(userGrades, mockDuration));
  }
});



export const mockInstructorSendGradeToLMS = (gradeData) => new Promise(function (resolve, reject) {
  const {assignmentId} = gradeData;
  const {isMockFailureResult, mockDuration} = getAsyncSpecs();

  let gradeSubmissionObj = Object.assign({}, gradeData);
  delete gradeSubmissionObj.assignmentId;

  if (isMockFailureResult) {
    setTimeout(() => reject(new Error("====> MOCK ERROR triggered by mockInstructorSendGradeToLMS()")), mockDuration);
  } else {
    setTimeout(() => {
      let userGrades = JSON.parse(localStorage.getItem(`boiler-scores-${assignmentId}`)) || [];
      let gradeIndex = userGrades.findIndex(g => g.studentId === gradeSubmissionObj.studentId);

      if (gradeIndex > -1) {
        userGrades[gradeIndex] = gradeSubmissionObj;
      } else {
        userGrades.push(gradeSubmissionObj);
      }

      localStorage.setItem(`boiler-scores-${assignmentId}`, JSON.stringify(userGrades));
      resolve(true, mockDuration)
    });
  }
});


export const mockAutoSendGradeToLMS = (gradeData) => new Promise(function (resolve, reject) {
  const {assignmentId} = gradeData;
  const {isMockFailureResult, mockDuration} = getAsyncSpecs();

  let gradeSubmissionObj = Object.assign({}, gradeData);
  delete gradeSubmissionObj.assignmentId;

  if (isMockFailureResult) {
    setTimeout(() => reject(new Error("====> MOCK ERROR triggered by mockAutoSendGradeToLMS()")), mockDuration);
  } else {
    setTimeout(() => {
      let userGrades = JSON.parse(localStorage.getItem(`boiler-scores-${assignmentId}`)) || [];
      let gradeIndex = userGrades.findIndex(g => g.studentId === gradeSubmissionObj.studentId);

      if (gradeIndex > -1) {
        console.log("Updated existing student grade", assignmentId, userGrades[gradeIndex]);
      } else {
        userGrades.push(gradeSubmissionObj);
        localStorage.setItem(`boiler-scores-${assignmentId}`, JSON.stringify(userGrades));
      }

      localStorage.setItem(`boiler-scores-${gradeData.resourceId}`, JSON.stringify(userGrades));

      resolve(true, mockDuration)
    });
  }
});


// ================================ Dev Utility Functions

// Creating mock course members should only happen once per courseId... and ideally, we don't need to clear/erase this data
export const createMockCourseMembers = (courseId, totalNumStudents) => {
  let courseMembers = JSON.parse(localStorage.getItem(`boiler-course-users-${courseId}`));
  if (courseMembers && courseMembers.length) return;

  let instructor1 = courseMembers?.members.find(m => m.id === '01');
  let instructor2 = courseMembers?.members.find(m => m.id === '02');
  if (instructor1 && instructor2) return;

  const members = [
    { id:"01", status:"Active", name:"Uncle Bob McBobberton", givenName:"Bob", familyName:"McBobberton", email:"UncleBob@FakeSchool.com", roles: ["instructor"], picture:"https://canvas.instructure.com/images/messages/avatar-50.png"},
    { id:"02", status:"Active", name:"Freddy McFreaky", givenName:"Freddy", familyName:"McFreaky", email:"FMcFreaky@Fake.com", roles: ["instructor"], picture:"https://canvas.instructure.com/images/messages/avatar-50.png"},
    { id:"a4c0a444-bc32-41d6-8edb-4df61f035ece", status:"Active", name:"Major Major", givenName:"Major", familyName:"Major", email:"Major@Major.com", roles: ["instructor"], picture:"https://canvas.instructure.com/images/messages/avatar-50.png"},
    ...generateMockMembers(totalNumStudents)


  ]

  localStorage.setItem(`boiler-course-users-${courseId}`, JSON.stringify(members));
}

export const createMockGrades = (grades) => {
  const assignmentId = grades[0].assignmentId;
  localStorage.setItem(`boiler-scores-${assignmentId}`, JSON.stringify(grades));
}

export const deleteMockGrades = (assignmentId) => {
  localStorage.setItem(`boiler-scores-${assignmentId}`, JSON.stringify([]));
}




export const generateMockMembers = (total)=> {
  const prefixes = ["", " IInd", " IIIrd", " IV", " V", " VI", " VII", " VIII", " IX", " X", " 11th", " 12th", " 13th", " 14th", " 15th", " 16th", " 17th", " 18th", " 19th", " 20th"];
  let members = [];
  let prefixNum = 0;
  let studentId = 10;

  while(members.length <= total) {
    const memberSet = testNames.map((n,i) => {
      return {
        id: (studentId+i).toString(),
        status: "Active",
        name: `${n.givenName} ${n.familyName}${prefixes[prefixNum]}`,
        givenName: n.givenName,
        familyName: `${n.familyName}${prefixes[prefixNum]}`,
        email: `${n.givenName}.${n.familyName}${prefixes[prefixNum]}@FakeMail.com`,
        roles: ["learner"],
        picture: ""
      }
    });

    members = members.concat(memberSet);
    prefixNum++;
  }

  members.splice(total);
  return members;
}

export const testNames = [
  {givenName:"Ann", familyName:"Aardvark"},
  {givenName:"Ava", familyName:"Aardwolf"},
  {givenName:"Alic", familyName:"Anthill"},
  {givenName:"Alex", familyName:"Aspirin"},
  {givenName:"Aaron", familyName:"Argonaut"},
  {givenName:"Betsy", familyName:"Bigbonett"},
  {givenName:"Brook", familyName:"Babbler"},
  {givenName:"Bob", familyName:"Bobberton"},
  {givenName:"Ben", familyName:"McBigsy"},
  {givenName:"Charlotte", familyName:"Chumpchange"},
  {givenName:"Chuck", familyName:"Chomp"},
  {givenName:"Carter", familyName:"Chinchilla"},
  {givenName:"Celene", familyName:"Crockpot"},
  {givenName:"Carlos", familyName:"VonCapybara"},
  {givenName:"Chelsea", familyName:"Camelton"},
  {givenName:"Dena", familyName:"Dingo"},
  {givenName:"Dan", familyName:"Dartfrog"},
  {givenName:"Derek", familyName:"Donkeyville"},
  {givenName:"Delilah", familyName:"Duckbutt"},
  {givenName:"Emma", familyName:"Ermine"},
  {givenName:"Ethan", familyName:"Elkson"},
  {givenName:"Ellen", familyName:"Eggplant"},
  {givenName:"Edgar", familyName:"VonEgret"},
  {givenName:"Fran", familyName:"McFurby"},
  {givenName:"Frank", familyName:"Feretwater"},
  {givenName:"Felix", familyName:"Fishnet"},
  {givenName:"Faith", familyName:"Friskybits"},
  {givenName:"Grace", familyName:"Geckofingers"},
  {givenName:"Gabe", familyName:"Gopherton"},
  {givenName:"Gary", familyName:"Gorillaheimer"},
  {givenName:"Gwen", familyName:"Garglespits"},
  {givenName:"Harper", familyName:"Humpback"},
  {givenName:"Henry", familyName:"Hyena"},
  {givenName:"Helen", familyName:"Howlermonkey"},
  {givenName:"Hank", familyName:"Hoseblower"},
  {givenName:"Isabel", familyName:"Inkblot"},
  {givenName:"Isaac", familyName:"Iguana"},
  {givenName:"Ivan", familyName:"Impala"},
  {givenName:"Ivanka", familyName:"Igloo"},
  {givenName:"Julia", familyName:"Jackrabbit"},
  {givenName:"Jenny", familyName:"Jellyfish"},
  {givenName:"Jack", familyName:"Jinglefingers"},
  {givenName:"Jacob", familyName:"Jamsplatt"},
  {givenName:"John", familyName:"Jumbocakes"},
  {givenName:"Jerry", familyName:"Jumpinjax"},
  {givenName:"Jackelyn", familyName:"Jigglesplits"},
  {givenName:"Kaylee", familyName:"Krawfish"},
  {givenName:"Kevin", familyName:"Kookaburra"},
  {givenName:"Kyle", familyName:"Kangarooster"},
  {givenName:"Kai", familyName:"Krumblecookie"},
  {givenName:"Karen", familyName:"Kringeworthy"},
  {givenName:"Kelly", familyName:"Komodo"},
  {givenName:"Lillian", familyName:"Limpsalot"},
  {givenName:"Liam", familyName:"McLemur"},
  {givenName:"Lester", familyName:"VonLlama"},
  {givenName:"Lisa", familyName:"Licksaspoon"},
  {givenName:"Mia", familyName:"Minimarts"},
  {givenName:"Mason", familyName:"Meerkat"},
  {givenName:"Mark", familyName:"McMarsupial"},
  {givenName:"Melissa", familyName:"Mollusk"},
  {givenName:"Mary", familyName:"Moosebait"},
  {givenName:"Natalie", familyName:"Newton"},
  {givenName:"Noah", familyName:"Nipplebinder"},
  {givenName:"Neil", familyName:"Nashtooth"},
  {givenName:"Nelly", familyName:"Notnever"},
  {givenName:"Natasha", familyName:"Narwhal"},
  {givenName:"Nicki", familyName:"Numbskull"},
  {givenName:"Olivia", familyName:"Oxbucket"},
  {givenName:"Oscar", familyName:"Orcapants"},
  {givenName:"Ollie", familyName:"Ocelot"},
  {givenName:"Olga", familyName:"Organgrinder"},
  {givenName:"Pete", familyName:"Plugpuller"},
  {givenName:"Penny", familyName:"Parkit"},
  {givenName:"Paul", familyName:"Possumbender"},
  {givenName:"Parker", familyName:"Puma"},
  {givenName:"Patricia", familyName:"Pigbits"},
  {givenName:"Quinn", familyName:"Quickerton"},
  {givenName:"Quincy", familyName:"VonQuokka"},
  {givenName:"Riley", familyName:"Rabidbat"},
  {givenName:"Rob", familyName:"Reefshark"},
  {givenName:"Ryan", familyName:"Riversquid"},
  {givenName:"Regina", familyName:"Rat"},
  {givenName:"Ron", familyName:"Rhinobinder"},
  {givenName:"Sofia", familyName:"Sheepslap"},
  {givenName:"Sam", familyName:"Sulkyshark"},
  {givenName:"Steve", familyName:"Snakefingers"},
  {givenName:"Sasha", familyName:"Skunkerton"},
  {givenName:"Svetlana", familyName:"McSamurai"},
  {givenName:"Stacy", familyName:"Sandflaps"},
  {givenName:"Stan", familyName:"Spidermonkey"},
  {givenName:"Taylor", familyName:"Topsyturvy"},
  {givenName:"Tom", familyName:"Thunderpants"},
  {givenName:"Trent", familyName:"Trickybits"},
  {givenName:"Tania", familyName:"Tigershark"},
  {givenName:"Ungar", familyName:"VonUglyshoe"},
  {givenName:"Ula", familyName:"Ulala"},
  {givenName:"Vic", familyName:"Vole"},
  {givenName:"Victoria", familyName:"Vetslap"},
  {givenName:"Vincent", familyName:"Vicarious"},
  {givenName:"Vladimir", familyName:"VonBatlegs"},
  {givenName:"Wes", familyName:"Wallaby"},
  {givenName:"Willow", familyName:"Warthog"},
  {givenName:"William", familyName:"Walrus"},
  {givenName:"Wendy", familyName:"Weasel"},
  {givenName:"Ximena", familyName:"Xylophone"},
  {givenName:"Xavier", familyName:"Xmenthal"},
  {givenName:"Yusuf", familyName:"Yakbutter"},
  {givenName:"Yaakov", familyName:"Yamsmasher"},
  {givenName:"Zoey", familyName:"Zebraparts"},
  {givenName:"Zach", familyName:"Zestwater"}
];

export const testComments = [
  "Wow.",
  "Amazing.",
  "So impressive. Really. Like, yeah.",
  "Quit school. I think you're done.",
  "Keep trying.",
  "Perhaps you should stick to gym classes.",
  "I'm not worthy.",
  "Why am I teaching? You should be teaching this.",
  "Pay me extra and I'll give you an A.",
  "I docked you points because you keep misspelling your own name.",
  "Awful.",
  "Painful to read, but brilliant when I stop.",
  "Don't take this the wrong way, but I'm giving you a passing score.",
  "Considering that you wrote this, I'm impressed.",
  "It hurts me to think you're trying your best.",
  "You are my favorite student and you can do no wrong.",
  "I feel like an idiot when I read your work. I don't know if you're so brilliant that I can't understand this, or if I'm not smart enough. Because of that, I'm going to give you a passing grade.",
  "Very average.",
  "Not the best, not the worst.",
  "Next time, try using a pen or pencil instead of crayons.",
  "Don't expect to do well in life.",
  "When you are rich and famous, please remember that I gave you straight A's.",
];
const { ipcRenderer } = require("electron");
const app = new Vue({
  el: "#vue-app",
  data: {
    startButton: {
      text: "GO",
      hidden: false,
    },
    running: false,
    completed: false,
    result: {
      ping: 0,
      download: 0,
      upload: 0,
    },
    planned: {
      ping: getRandomInt(1, 5),
      download: getRandomArbitrary(500, 1500, 2),
      upload: getRandomArbitrary(100, 500, 2),
      serverid: 11250,
    },
    anim: null,
    resultId: 0,
    isSettingShowing: false,
    true: true,
    false: false,
  },
  watch: {
    running(val) {
      this.startButton.text = val ? "Working" : "GO";
    },
    completed(val) {
      if (val === true) this.transBack();
      this.startButton.text = "RESTART";
    },
    "planned.ping"(val) {
      this.planned.ping = parseInt(val || 0);
    },
    "planned.download"(val) {
      this.planned.download = parseFloat(val || 0);
    },
    "planned.upload"(val) {
      this.planned.upload = parseFloat(val || 0);
    },
    "planned.serverid"(val) {
      if (val.includes("refetch")) {
        app.$refs.serverList.options.length = 0;
        app.$refs.serverList.options.add(createOption("0", "Loading.."));
        app.$refs.serverList.options.selectedIndex = 0;
        ipcRenderer.send("serverList");
      } else {
        this.planned.serverid = val;
      }
    },
  },

  methods: {
    startTest(e) {
      if (this.running) return;
      if (this.completed) return this.resetTest();
      this.running = true;

      ipcRenderer.send("fakeTest", app.planned);

      this.anim = anime({
        targets: app.result,
        ...app.planned,
        easing: "easeOutCirc",
        round: 20,
        delay: 1000,
        duration: 6000,
        complete() {
          app.running = false;
          app.completed = true;
          // app.startButton.hidden = true;
        },
      });
    },
    transBack() {
      this.anim = anime({
        targets: ".trans",
        duration: 800,
        translateY: "0",
        opacity: "1",
        easing: "easeInOutQuad",
      });
    },
    trans() {
      this.anim = anime({
        targets: ".trans",
        duration: 800,
        translateY: "-150",
        opacity: "0",
        easing: "easeInOutQuad",
      });
    },
    resetTest() {
      app.running = app.completed = app.startButton.hidden = false;
      this.result.ping =
        this.result.download =
        this.result.upload =
        this.resultId =
          0;
      this.startTest();
    },
  },
  /*  computed: {
    asd: () => {
      if (app.completed == true) {
        return this.transback();
      }
    },
  }, */
});

ipcRenderer.on("resultId", (event, data) => {
  if (!data) {
    if (!app.anim) return;
    app.anim.complete();
    return app.resetTest();
  }
  app.resultId = data;
});

ipcRenderer.on("serverList", (event, servers) => {
  app.$refs.serverList.options.length = 0;

  app.$refs.serverList.options.add(createOption("refetch", "<- Refetch ->"));

  servers.forEach((data) => {
    app.$refs.serverList.options.add(
      createOption(data.id, `${data.country} | ${data.name} - ${data.sponsor}`)
    );
  });

  app.$refs.serverList.options.selectedIndex = 1;

  app.$refs.serverList.options.add(createOption("refetch-", "<- Refetch ->"));
});
ipcRenderer.send("serverList");
app.$refs.serverList.options.add(createOption("0", "Loading.."));
app.$refs.serverList.options.selectedIndex = 0;

// https://stackoverflow.com/a/1527820/11949394
function getRandomArbitrary(min, max, fixer = 4) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(fixer));
}

// https://stackoverflow.com/a/1527820/11949394
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createOption(value, text) {
  let option = document.createElement("option");
  option.value = value;
  option.textContent = text;
  return option;
}

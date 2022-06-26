describe("API Testing", function () {
  let request_url = Cypress.env("api_server");
  let username = "uw4ggQWL8A@yopmail.com", // default
    password = "txMzwHU50D12wO2G"; // default
  let headers = {
    authority: "be.dev.studysmarter-test.de",
    accept: "application/json, text/plain, */*",
    "accept-language": "en-US,en;q=0.9",
    "content-type": "application/json",
    origin: "https://demo.studysmarter.de",
    "sec-ch-ua":
      '".Not/A)Brand";v="99", "Google Chrome";v="103", "Chromium";v="103"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"macOS"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "cross-site",
  };
  let userID = "from_Request"; // must come from Login step
  let token = "from_Request"; // must come from Login step
  let new_studySet_name = "StudySet_t1nIPsi8OyhU"; // default

  it("Signup with new user", function () {
    // Register with new email address
    request_url = Cypress.env("api_server") + Cypress.env("user_endpoint");

    cy.fixture("register").then((request_body) => {
      let temp = request_body.email.toString().split("@");
      temp[0] = makeid(10);
      request_body.email = temp.join("@");
      username = request_body.email;
      password = request_body.password;

      cy.request({
        method: "POST",
        url: request_url,
        body: JSON.stringify(request_body),
        headers: headers,
      })
        .then((response) => {
          expect(response.status).to.eq(201);
          expect(response.body).to.have.property("id");
          expect(response.body).to.have.property("token");
        })
        .as("register_result");
    });

    cy.then(() => {
      // TestGroup Update
      let temp = Cypress.env("testgroup_endpoint").toString().split("/");
      temp[0] = this.register_result.body.id;

      request_url =
        Cypress.env("api_server") +
        Cypress.env("user_endpoint") +
        temp.join("/");
      headers.authorization = "Token " + this.register_result.body.token;
      cy.fixture("testGroup").then((request_body) => {
        cy.request({
          method: "POST",
          url: request_url,
          body: JSON.stringify(request_body),
          headers: headers,
        })
          .then((response) => {
            expect(response.status).to.eq(201);
            expect(response.body).to.have.property("appuser");
          })
          .as("testGroup_result");
      });
    });
  });

  it("Login to Application | do not skip", function () {
    // Login & token Generation
    request_url = Cypress.env("api_server") + Cypress.env("apitoken_endpoint");
    cy.fixture("login").then((request_body) => {
      request_body.username = username;
      request_body.password = password;
      cy.request({
        method: "POST",
        url: request_url,
        body: JSON.stringify(request_body),
        headers: headers,
      })
        .then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body).to.have.property("id");
          expect(response.body).to.have.property("token");
        })
        .as("token_result");
    });

    cy.then(() => {
      token = this.token_result.body.token;
      userID = this.token_result.body.id;
    });

    cy.then(() => {
      // User Details
      request_url =
        Cypress.env("api_server") + Cypress.env("user_endpoint") + userID + "/";
      headers.authorization = "Token " + token;
      cy.request({
        method: "GET",
        url: request_url,
        headers: headers,
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property("id");
        expect(response.body).to.have.property("user");
        expect(response.body).to.have.property("tutorial");
      });
    });

    cy.then(() => {
      //Dashboard Streak
      request_url =
        Cypress.env("api_server") +
        Cypress.env("user_endpoint") +
        userID +
        "/" +
        Cypress.env("dashboard_streak_endpoint");
      headers.authorization = "Token " + token;
      cy.request({
        method: "GET",
        url: request_url,
        headers: headers,
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property("current_weekly_streak");
        expect(response.body).to.have.property("current_logged_in_streak");
      });
    });
  });

  it("Create new study set", function () {
    // New study set
    new_studySet_name = "StudySet_" + makeid(12);
    request_url =
      Cypress.env("api_server") +
      Cypress.env("user_endpoint") +
      userID +
      "/" +
      Cypress.env("study_set_endpoint");

    headers.authorization = "Token " + token;
    cy.fixture("studySet").then((request_body) => {
      request_body.name = new_studySet_name;
      cy.request({
        method: "POST",
        url: request_url,
        body: JSON.stringify(request_body),
        headers: headers,
      }).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body).to.have.property("id");
        expect(response.body).to.have.property("name", new_studySet_name);
      });
    });
  });

  it("Validate newly created study set is present", function () {
    // fetch all study sets & validate new study set in response.
    request_url =
      Cypress.env("api_server") +
      Cypress.env("user_endpoint") +
      userID +
      "/" +
      Cypress.env("all_study_set_endpoints");

    headers.authorization = "Token " + token;
    cy.request({
      method: "GET",
      url: request_url,
      headers: headers,
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property("results");
      var result = response.body.results;

      var members = [];
      result.forEach(function (e) {
        members.push(e.name);
      });
      expect(members).to.include(new_studySet_name);
    });
  });
});

function makeid(length) {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

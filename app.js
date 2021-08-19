const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "covid19India.db");

const app = express();

app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertingStateTable = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertingDistrictTable = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    select * from state;
    `;
  const dbUser = await db.all(getStatesQuery);
  response.send(dbUser.map((eachState) => convertingStateTable(eachState)));
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateOnIdQuery = `
    select * from state where state_id = ${stateId};
    `;

  const dbUser = await db.get(getStateOnIdQuery);
  response.send(convertingStateTable(dbUser));
});

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const createDistrictQuery = `Insert into district 
  (district_name, state_id, cases, cured, active, deaths)
  Values 
  ('${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths});`;
  const dbUser = await db.run(createDistrictQuery);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getSDistrictsQuery = `
    select * from district where district_id = ${districtId};
    `;
  const dbUser = await db.get(getSDistrictsQuery);
  response.send(convertingDistrictTable(dbUser));
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const deleteDistrictQuery = `
    delete from district where district_id = ${districtId};`;
  const dbUser = await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const { districtId } = request.params;

  const updateDistrictQuery = `
    update district 
    set 
        district_name = '${districtName}',
        state_id = ${stateId},
        cases = ${cases},
        cured = ${cured},
        active = ${active}, 
        deaths = ${deaths}
     WHERE
    district_id = ${districtId};
    `;
  const dbUser = await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateOnIdQuery = `
    select 
    sum(cases), sum(cured), sum(active), sum(deaths)
    from district where state_id = ${stateId};
    `;

  const dbUser = await db.get(getStateOnIdQuery);
  response.send({
    totalCases: dbUser["sum(cases)"],
    totalCured: dbUser["sum(cured)"],
    totalActive: dbUser["sum(active)"],
    totalDeaths: dbUser["sum(deaths)"],
  });
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStatesQuery = `
    select state_name from state join district
    where district_id = ${districtId};
    `;
  const dbUser = await db.get(getStatesQuery);
  response.send({
    stateName: dbUser.state_name,
  });
});

module.exports = app;

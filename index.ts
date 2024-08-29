import { config } from "dotenv";
import express from "express";
import dotenv from "dotenv";
dotenv.config();
import session, { MemoryStore } from "express-session";
import { MongoClient } from "mongodb";

let uri = process.env.MONGODB_URI ?? "";
const client = new MongoClient(uri);
const userCollection = client.db("ExamenWebontwikkeling").collection("Users");
const app = express();
app.use(
  session({
    secret: "uw geheime sleutel",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);
app.set("view engine", "ejs");
app.set("port", 3000);

declare module "express-session" {
  export interface SessionData {
    user: User;
  }
}

interface User {
  username: string;
  password: string;
}

export default session({
  secret: process.env.SESSION_SECRET ?? "my-super-secret-secret",
  store: new MemoryStore(),
  resave: true,
  saveUninitialized: true,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
  },
});
let spells: any[];
let aantalSpreuken: any[];

async function fetchAPI() {
  const response = await fetch("https://www.dnd5eapi.co/api/spells");
  if (response.ok) {
    console.log("Response ok.");
    const data = await response.json();
    spells = data.results.filter((spell: any) => spell.level < 7);
    console.log(spells);
    /*/ let aantalSpreuken: any[] = spells.reduce((acc, spell) => {
        
    });
    console.log(aantalSpreuken[1]);/*/
  }
}

async function connect() {
  await client.connect();
  console.log("Connected to database");
}

async function createInitialUser() {
  let username = "Gilles";
  let password = "Gilles";
  if ((await userCollection.countDocuments()) < 1) {
    await userCollection.insertOne({
      username: username,
      password: password,
    });
  }
}

async function login(username: string, password: string) {
  if (username === "" || password === "") {
    throw new Error("Email and password required");
  }
  let user: User | null = await userCollection.findOne<User>({
    username: username,
  });
  if (user) {
    if (user.password == password) {
      return user;
    } else {
      throw new Error("Password incorrect");
    }
  } else {
    throw new Error("User not found");
  }
}
app.get("/", async (req, res) => {
  res.render("home", {
    spells,
    aantalSpreuken,
  });
});

app.get("/login", async (req, res) => {
  res.render("login");
});

app.post("/", async (req, res) => {
  const email: string = req.body.email;
  const password: string = req.body.password;
  try {
    let user: User = await login(email, password);
    req.session.user = user;
    res.redirect("/");
  } catch (e: any) {
    res.redirect("/login");
  }
});

// handlers komen hier
app.listen(app.get("port"), async () => {
  await fetchAPI();
  await connect();
  await createInitialUser();
  console.log("[server] http://localhost:" + app.get("port"));
});

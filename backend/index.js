const bodyparser = require("body-parser");
const express = require("express");
const app = express();
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { connect } = require("./db");
const router = require("./Routes/index");
const port = 5000;

// Ensure generated-resumes directory exists
const resumeDir = path.join(__dirname, "generated-resumes");
if (!fs.existsSync(resumeDir)) {
    fs.mkdirSync(resumeDir, { recursive: true });
}

app.use(cors());
app.use(bodyparser.json({ limit: "50mb" }));
app.use(bodyparser.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.json());

// Serve generated resume PDFs statically
app.use("/generated-resumes", express.static(resumeDir));

app.get("/", (req, res) => {
    res.send("hello this is internshala backend");
});

app.use("/api", router);
connect();

app.listen(port, () => {
    console.log(`Server is running on the port ${port}`);
});
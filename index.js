var express = require("express");
var http = require('http');
var path = require('path');
var nodemailer = require('nodemailer');
const { MongoClient } = require('mongodb');

var app = express();
var server = http.Server(app);
var port = 5000;

app.set("port", port);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the static HTML files
app.use(express.static(path.join(__dirname, "pages")));

const mongoURI = 'mongodb://localhost:27017';
const dbName = 'emailDatabase';
const collectionName = 'emails';
const emailUser = '@gmail.com';  //  // replace with your actual mail
const emailPass = '';  // replace with your actual app password

let membershipId = 1000; // Initialize membership ID

// Function to connect to MongoDB
async function connectToMongo() {
    const client = new MongoClient(mongoURI, { useUnifiedTopology: true });

    try {
        await client.connect();
        console.log('Connected to MongoDB');
        return client.db(dbName).collection(collectionName);
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        throw error;
    }
}

// Routing
app.get("/", function(req, res) {
    res.sendFile(path.join(__dirname, "pages", "index.html"));
});

app.get("/sent", function(req, res) {
    res.sendFile(path.join(__dirname, "pages", "sent.html"));
});

// Handle form submission
app.post("/send_email", async function(req, res) {
    var name = req.body.name;
    var uid = req.body.uid;
    var officialMail = req.body.officialMail;
    var mail = req.body.mail;
    var phone = req.body.phone;
    var message = req.body.message;

    const collection = await connectToMongo();

    // Generate the next membership ID
    const currentMembershipId = membershipId;
    membershipId++;

    // Insert email data into MongoDB with membership ID
    try {
        await collection.insertOne({ name, uid, officialMail, mail, phone, message, membershipId: currentMembershipId });
        console.log('Data inserted into MongoDB');
    } catch (error) {
        console.error('Error inserting email data into MongoDB:', error);
        res.status(500).send("Error saving data");
        return;
    }

    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: emailUser,
            pass: emailPass
        }
    });

    var mailOptions = {
        from: emailUser,
        to: mail,
        subject: `GFG-CU MEMBERSHIP ID is ${currentMembershipId} `,
        text: `Dear ${name},\n\nThank you for registering. Your membership ID is ${currentMembershipId}.\n\nMessage: ${message}`,
    };

    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.log(error);
            res.status(500).send("Error sending email");
        } else {
            console.log("Email sent: " + info.response);
            res.redirect("/sent");
        }
    });
});

server.listen(port, function() {
    console.log(`Server is running at port ${port}`);
});

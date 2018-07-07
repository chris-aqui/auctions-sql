const mysql = require("mysql");
const inquirer = require("inquirer");
require("dotenv").config();
const keys = require('./keys');

const connection = mysql.createConnection({
  host: "localhost",

  // Your port; if not 3306
  port: 3306,

  // Your username
  user: "root",

  // Your password
  password: process.env.SQL_PASSWORD,
  database: "greatBay_DB"
});
// connect to the mysql server and sql database
connection.connect(function (err) {
  try {
    console.log('something happened');
    // run the start function after the connection is made to prompt the user
    start();
  } catch (error) {
    if (err) throw err;
  }
});

// function which prompts the user for what action they should take
function start() {
  inquirer
    .prompt({
      name: "postOrBid",
      type: "list",
      message: "Would you like to [POST] an auction or [BID] on an auction?",
      choices: ["POST", "BID", "VIEW ALL", "End"]
    }).then(function (answer) {
      // based on their answer, either call the bid or the post functions
      (answer.postOrBid.toUpperCase() === "POST") ?
      postAuction():
      (answer.postOrBid.toUpperCase() === "BID") ?
      bidAuction() :
      (answer.postOrBid.toUpperCase() === "VIEW ALL") ?
      allTables():
      endConnect();

    });
}

function postAuction() {
  // prompt for info about the item being put up for auction
  inquirer.prompt([{
      name: "item",
      type: "input",
      message: "What is the item you would like to submit?"
    },
    {
      name: "category",
      type: "input",
      message: "What category would you like to place your auction in?"
    },
    {
      name: "startingBid",
      type: "input",
      message: "What would you like your starting bid to be?",
      validate: function (value) {
        if (isNaN(value) === false) {
          return true;
        }
        return false;
      }
    }
  ]).then(function (answer) {
    // when finished prompting, insert a new item into the db with that info
    connection.query(
      "INSERT INTO auctions SET ?", {
        item_name: answer.item,
        category: answer.category,
        starting_bid: answer.startingBid,
        highest_bid: answer.startingBid
      },
      function (err) {
        if (err) throw err;
        console.log("Your auction was created successfully!");
        // re-prompt the user for if they want to bid or post
        start();
      }
    );
  });
};


function bidAuction() {
  // query the database for all items being auctioned
  connection.query("SELECT * FROM auctions", function (err, results) {
    if (err) throw err;
    // once you have the items, prompt the user for which they'd like to bid on
    inquirer
      .prompt([{
          name: "choice",
          type: "list",
          choices: function () {
            var choiceArray = [];
            for (var i = 0; i < results.length; i++) {
              choiceArray.push(results[i].item_name);
            }
            return choiceArray;
          },
          message: "What auction would you like to place a bid in?"
        },
        {
          name: "bid",
          type: "input",
          message: "How much would you like to bid?"
        }
      ])
      .then(function (answer) {
        // get the information of the chosen item
        var chosenItem;
        for (var i = 0; i < results.length; i++) {
          if (results[i].item_name === answer.choice) {
            chosenItem = results[i];
          }
        }

        // determine if bid was high enough
        if (chosenItem.highest_bid < parseInt(answer.bid)) {
          // bid was high enough, so update db, let the user know, and start over
          connection.query(
            "UPDATE auctions SET ? WHERE ?", [{
                highest_bid: answer.bid
              },
              {
                id: chosenItem.id
              }
            ],
            function (error) {
              if (error) throw err;
              console.log("Bid placed successfully!");
              start();
            }
          );
        } else {
          // bid wasn't high enough, so apologize and start over
          console.log("Your bid was too low. Try again...");
          start();
        }
      });
  });
}

function allTables() {
  console.log("Selecting all Items...\n");
  connection.query("SELECT * FROM auctions", function(err, res) {
    if (err) throw err;
    // Log all results of the SELECT statement
    console.log(res);
    start();
    // connection.end();
  });
}

function endConnect() {
  connection.end();
}
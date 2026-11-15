// // import express from "express"

// // let app = express()

// // // get request 

// // app.get("/",(req,res)=>{
// //     res.send(
// //         [
// //             {id : 1 , name : "talha", email : "abc@gmail.com"},
// //             {id : 2 , name : "talha", email : "abc@gmail.com"},
// //             {id : 3 , name : "talha", email : "abc@gmail.com"},
// //             {id : 4 , name : "talha", email : "abc@gmail.com"},
// //             {id : 5 , name : "talha", email : "abc@gmail.com"},
// //         ]
// //     )
// // })
// // let users = []

// // // post request 
// // app.post("/api/user",(req,res)=>{

// //     const { name , email } =  req.body
// //     if ( !name || !email ) {
// //         return res.status(400).send("id and name are required")
// //     }
// //     const newUser = {
// //         id : Date.now(),
// //         name, 
// //         email
// //     }
// //     users.push(newUser)

// //     res.status(200).json({
// //         message : "user created successfully",
// //         user : users
// //     })
// // })

// // //  put route 

// // app.listen(5500,()=>{
// //     console.log("server is running on port 5500")
// //     console.log("https://localhost:5500")
// // })

// // practice of the  api 

// let patient = [{
//     id : 1 , patient : "taha" , bill : 5500
// } ,{
//     id : 1 , patient : "taha" , bill : 5500
// } ,{
//     id : 1 , patient : "taha" , bill : 5500
// } ,{
//     id : 1 , patient : "taha" , bill : 5500
// } ,]

// import express from "express"


// let user = []
// let app = express()

// app.use(express.json())
// // app.use(cors())

// app.get("/patient",(req, res)=>{

//     res.json({
//         "data": patient
//     })

// })

// app.post("/user", (req,res)=>{
//     if(req.body){
//         user.push(req.body)
//     }
//     res.json({
//         "status": "true",
//         "data" : user
//     })
// })
// app.listen(5500, ()=>{
//     console.log("https://localhost:5500")
// })


import express from 'express';


const app = express();


// req body --> usko read ker parahy hain..
app.use(express.json())

// database 

let users = [
    {
        username : "hasanCoder66",
        email : "codermhasan@gmail.com"
    },
    {
        username : "sufiyan",
        email : "sufiyan@gmail.com"
    },
]

// create
app.post("/user", (req, res) => {


    const data = req.body;


   if(data){
     users.push(data)
     
   }

   if(!data){
    return res.status(400).json({
        status : "false",
        message: "some problem"
    })
   }

    res.status(200).json({
        status : "true",
        message :"user added sucessfully"
    })
})


// read
app.get("/user", (req, res) => {

    res.status(200).json({
        status : "true",
        data : users
    })
})


// get single user

app.get("/user/:username", (req, res) => {
    
    const {username} = req.params;

    // console.log(param);

    let findUser = users.find((user) => {
        if(user.username == username){
            return user
        }
        
    })
    

    res.status(200).json({
        status : "true",
        message: "single user data",
        data : findUser
    })
})



// update
app.put("/user/:username", (req, res) => {

    const body = req.body;
    const {username} = req.params;

   users = users.map((user) => {
    if(user.username == body.username){
        return user = body
    }

    return user
})

    res.status(200).json({
        status : "true",
        message:"updated user successfully!"
    })
})


// delete
app.delete("/user/:username", (req, res) => {

    const {username} = req.params;

   users = users.filter((user) => user.username != username)

    res.status(200).json({
        status : "true",
        message:"deleted user successfully!"
    })
})

app.listen(5500, () => {
    console.log("server is listening on port 5500");
    
})                      
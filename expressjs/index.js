// import express from "express"

// let app = express()

// // get request 

// app.get("/",(req,res)=>{
//     res.send(
//         [
//             {id : 1 , name : "talha", email : "abc@gmail.com"},
//             {id : 2 , name : "talha", email : "abc@gmail.com"},
//             {id : 3 , name : "talha", email : "abc@gmail.com"},
//             {id : 4 , name : "talha", email : "abc@gmail.com"},
//             {id : 5 , name : "talha", email : "abc@gmail.com"},
//         ]
//     )
// })
// let users = []

// // post request 
// app.post("/api/user",(req,res)=>{

//     const { name , email } =  req.body
//     if ( !name || !email ) {
//         return res.status(400).send("id and name are required")
//     }
//     const newUser = {
//         id : Date.now(),
//         name, 
//         email
//     }
//     users.push(newUser)

//     res.status(200).json({
//         message : "user created successfully",
//         user : users
//     })
// })

// //  put route 

// app.listen(5500,()=>{
//     console.log("server is running on port 5500")
//     console.log("https://localhost:5500")
// })

// practice of the  api 

let patient = [{
    id : 1 , patient : "taha" , bill : 5500
} ,{
    id : 1 , patient : "taha" , bill : 5500
} ,{
    id : 1 , patient : "taha" , bill : 5500
} ,{
    id : 1 , patient : "taha" , bill : 5500
} ,]

import express from "express"


let user = []
let app = express()

app.use(express.json())
// app.use(cors())

app.get("/patient",(req, res)=>{

    res.json({
        "data": patient
    })

})

app.post("/user", (req,res)=>{
    if(req.body){
        user.push(req.body)
    }
    res.json({
        "status": "true",
        "data" : user
    })
})
app.listen(5500, ()=>{
    console.log("https://localhost:5500")
})
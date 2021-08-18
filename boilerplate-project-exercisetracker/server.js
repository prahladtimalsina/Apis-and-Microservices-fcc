const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongo = require("mongodb");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");


app.use(cors())
mongoose
  .connect(process.env.MONGO_DB_PROD_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
  })
  .then(() => console.log("Database connected!"))
  .catch(err => console.log(err));


app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

///1
let exerciseSessionSchema = new mongoose.Schema({
  description:{type:String,required:true},
  duration:{type:Number, required:true},
  date:String
  
  
})


let userSchema = new mongoose.Schema({
  
  username:{type:String,required:true},
  log:[exerciseSessionSchema]
  
})

let Session = mongoose.model('Session',exerciseSessionSchema)
let User = mongoose.model('User',userSchema)

//end 1


//2

app.post('/api/users',bodyParser.urlencoded({
  extended:false
}),(request,response)=>{
  // console.log(request.body)
  let newUser = new User({username:request.body.username})
  newUser.save((error,savedUser)=>{
    if(!error){
      let responseObject = {}
      responseObject['username'] = savedUser.username
      responseObject['_id'] = savedUser.id
      response.json(responseObject)
      
    }
  })
})
//2

//3

app.get('/api/users',(request,response)=>{
  User.find({},(error,arrayOfUsers)=>{
    if(!error){
      response.json(arrayOfUsers) 
    }
    
  });
})
//3

//4
app.post('/api/users/:_id/exercises',bodyParser.urlencoded({
  extended:false
}),(request,response)=>{
  
  // console.log(request.body)
  let newSession = new Session({
    description:request.body.description,
    duration:parseInt(request.body.duration),
    date:request.body.date
  })
  if(newSession.date  === ''){
     newSession.date = new Date().toISOString().substring(0, 10)
     }
  
  User.findByIdAndUpdate(
  request.params._id,
    {$push:{log:newSession}},
    {new:true},
    (error,updatedUser)=>{
      if(!error){
        let responseObject ={}
      responseObject['_id']=updatedUser._id
      responseObject['username']=updatedUser.username
      responseObject['description']=newSession.description
      responseObject['duration']=newSession.duration
      responseObject['date']= new Date(newSession.date).toDateString()
        
      response.json(responseObject)
      }
    }
  )
  // response.json({})
  
});

//4


//5


app.get("/api/users/:_id/logs",(request,response)=>{
//   console.log(request.query.userid)
//   response.json({
//     name:request.query.userid
//   })
  
   User.findById(request.query._id,(error,result)=>{
     // console.log(result.log.length )
    if(!error){
      
      let responseObject = result
      if(request.query.from || request.query.to){
        let fromDate = new Date(0)
        let toDate = new Date()
        
        
        if(request.query.from){
          fromDate = new Date(request.query.from)
        }
        
        if(request.query.to){
        toDate = new Date(request.query.to)
        }
        
        fromDate = fromDate.getTime()
        toDate = toDate.getTime()
        
        
        responseObject.log = responseObject.log.filter((session)=>{
          let sessionDate =  new Date(session.date).getTime() //unix timestap convert
          return sessionDate >=fromDate && sessionDate <= toDate
        })
            
      }  
      
      if(request.query.limit){
        responseObject.log =responseObject.log.slice(0,request.query.limit)
      }
      responseObject['count'] =result.log.length
      response.json(responseObject)
      
    }
  })

  
  
  
});


//5















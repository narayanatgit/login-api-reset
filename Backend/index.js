const express = require("express");
const app = express();
const jwt=require('jsonwebtoken')
const bodyParser = require("body-parser");
const cors = require("cors");
const {v4 : uuidv4} = require('uuid')
const nodemailer = require('nodemailer');
const mongoose = require("mongoose");
require('dotenv').config();
const jwt_secret="hello world"

const validatorr=require('deep-email-validator')
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

mongoose.connect("mongodb://127.0.0.1:27017/users", {
	useNewUrlParser: true,
},(err) =>
err ? console.log(err) : console.log(
  "Connected to yourDB-name database"));

  const register=new mongoose.Schema({
	id:String,
	username:String,
    email:String,
	password:String
  });
  const ref=mongoose.model("ref",register);
  app.post("/Register",(req,res)=>{
	async function createlogin()
	{
		const emailValid = await validatorr.validate(req.body.email)
		id=uuidv4()
		if(!req.body.username)
		{
			return res.status(400).json({ error: 'username is required' });
		}
		if(!req.body.email)
		{
			return res.status(400).json({ error: 'email is required' });
		}
		if(!req.body.password)
		{
			return res.status(400).json({ error: 'passwaord is required' });
		}
		console.log(req.body)
		const username1=req.body.username
		
		console.log(emailValid)
		if(!emailValid.valid){return res.status(400).json({ error: 'enter valid email address' });}
       
		
		const reg=new ref({
			id:id,
			username:req.body.username,
            email:req.body.email,
			password:req.body.password
		})
		ref.countDocuments({$or:[{username:username1} ,{email:req.body.email}]}, async(err, count) => {
			
			console.log(count)
			if (err) {
			  console.error('Error:', err);
			} else {
			  if (count > 0) {
				return res.status(400).json({error:'user already exists'});
			  } else {
				const regs =await reg.save();
				return res.status(200).json({status:'success'})
			  }
			}})
		

	}
 			createlogin()});
			 app.post("/valid",async(req,res)=>
			 {
				 
				 const user = await ref.findOne( {username:req.body.username});
				 if(!user){return res.status(400).json({error:'Enter correct username or register'});}
				 if(user)
				 {
					 console.log(req.body.password)
					 console.log(user.password)
					 if(user.password.trim()==req.body.password)
					 {
						 console.log("success")
						
						 data={username:user.username,status:true}
						 res.status(200).json(data)
						 
					 }
					 else
					 {
						 return res.status(400).json({error:'Enter correct password'})
					 }
				 }
				 else
				 {
					return res.status(400).json({ error: 'Register to login' });
				 }
			 })


			 app.post("/forget",async(req,res)=>
			 {
				const emailValid = await validatorr.validate(req.body.email)
				console.log(req.body.email)
				if(!req.body.email){return res.status(400).json({ error: 'enter the email address to get otp' })}
				console.log(emailValid)
				if(!emailValid.valid){return res.status(400).json({ error: 'enter valid email address' });}
				const user = await ref.findOne( {email:req.body.email});
				if(!user.email){return res.status(400).json({ error: 'register to login' })}
				

				const secret=jwt_secret+user.password
				const payload={
					email:user.email,
					id:user.id
				}
                const token=jwt.sign(payload,secret,{expiresIn:'15m'})
				const link='http://localhost:3001/reset-password/'+user.id+'/'+token
				const transporter = nodemailer.createTransport({
                    service: 'Gmail',
                    auth: {
                        user: process.env.email,
                        pass: process.env.password,
                    },
                });
				const mailOptions = {
                    from: "narayanrsk@gmail.com",
                    to: req.body.email,
                    subject: 'Password reset link',
                    text: `Your Link (It is expired after 15 min) : ${link}`,
                };

				transporter.sendMail(mailOptions, (error, info) => {
					if (error) {
						console.error('Error occurred:', error);}
                        else{return res.json({
                            Link: link,status:"success"
                        })}
                    
                });
				
			 })



			 

			 app.post("/reset-password/:id/:token",async(req,res)=>
			 {
				const{id,token}=req.params
		console.log(JSON.stringify(token))
				const {password,confirmpassword}=req.body
				const user=await ref.findOne({id:id})
				console.log(user.email)
				if(!user.id){return res.status(404).json({error:"invalid id"})}
				const secret=jwt_secret+user.password
				try{
                    if(password===confirmpassword)
					{
                     const payload=jwt.verify(token,secret)
					 user.password=password
					 const changepassword =await user.save();
					 return res.status(200).json({status:"success"})}
					 else{
						return res.status(404).json({error:"password does not match"})
					 }
				}
				catch(error){

				}
			 })







app.listen(3000, () => {
	console.log("running");
});

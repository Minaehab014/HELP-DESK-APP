// const userModle = require("../../../../Downloads/HELP-DESK-APP-Minaehab (1)/HELP-DESK-APP-Minaehab/backend/models/userModel")
// const KonwledgeModle = require("../../../../Downloads/HELP-DESK-APP-Minaehab (1)/HELP-DESK-APP-Minaehab/backend/models/knowledgeModel")
// const knowledgeModel = require("../../../../Downloads/HELP-DESK-APP-Minaehab (1)/HELP-DESK-APP-Minaehab/backend/models/knowledgeModel")
// const agentModel = require("../../../../Downloads/HELP-DESK-APP-Minaehab (1)/HELP-DESK-APP-Minaehab/backend/models/agentModel")
// const ticketModel = require("../../../../Downloads/HELP-DESK-APP-Minaehab (1)/HELP-DESK-APP-Minaehab/backend/models/ticketModel")
// const automatedModel = require("../../../../Downloads/HELP-DESK-APP-Minaehab (1)/HELP-DESK-APP-Minaehab/backend/models/automatedworkflowModel")
// const ticketmanagerModel = require("../../../../Downloads/HELP-DESK-APP-Minaehab (1)/HELP-DESK-APP-Minaehab/backend/models/ticketmanagerModel")

const userModle = require("../models/userModel");
const KonwledgeModle = require("../models/knowledgeModel");
const knowledgeModel = require("../models/knowledgeModel");
const agentModel = require("../models/agentModel");
const ticketModel = require("../models/ticketModel");
const automatedModel = require("../models/automatedworkflowModel");
const ticketmanagerModel = require("../models/ticketmanagerModel");


const bcrypt = require("bcrypt");


// update user info
module.exports.update = async (req,res)=>{
const {password,name} = req.body
try{
    if(!password || !name)return res.json({mssg:"All fields should be filled"})
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt);
    await userModle.updateOne({_id:req.user._id},{$set:{name:name,password:hashedPassword}})
    return res.json({mssg:`${name}'s profile has been updated`})

}catch(err){
  console.log(err)
  res.json({mssg:"Error in update"})
}
}

//Get data from the Knowledgebase
module.exports.Konwledge_base = async(req,res)=>{
  const{category} = req.body
  try{
    if(category === ""){
      const all_data = await KonwledgeModle.find({}).sort({category: 1});
      return res.json(all_data)
    }
    const data = await knowledgeModel.find({category})
    return res.json(data)
  }catch(err){
      console.log(err)
      res.status(500).send('Server Error')
  }
}
// module.exports.Konwledge_base = async(req,res)=>{
//   const category = req.category; // get category from query parameters
//   try{
//     if(!category || category === ""){
//       const all_data = await KonwledgeModle.find({}).sort({category: 1}); // sort by category
//       return res.json(all_data);
//     }
//     const data = await knowledgeModel.find({category}).sort({category: 1}); // sort by category
//     return res.json(data);
//   }catch(err){
//     console.log(err);
//     res.status(500).send('Server Error');
//   }
// }

// create a ticket
module.exports.sendTicket = async (req,res)=>{
const{issueType,subCategory,priority,mssg} = req.body
try{
 // create the ticket
const ticket = await ticketModel.create({user:req.user._id,issueType,subCategory,priority,mssg,status:"open"})
// insert ticketId in ticketManger based on priority
if(priority === "high") await ticketmanagerModel.updateOne({Manager_number:1},{$push:{high_priority:ticket._id}})
if(priority === "medium") await ticketmanagerModel.updateOne({Manager_number:1},{$push:{medium_priority:ticket._id}})
if(priority === "low") await ticketmanagerModel.updateOne({Manager_number:1},{$push:{low_priority:ticket._id}})

//Get the tickets in ticket_Manger
const ticket_Manager = await ticketmanagerModel.findOne({Manager_number:1})

//loop on high priority tickets and assign it to agent if he is available
for(let i=0; i <ticket_Manager.high_priority.length;i++){

  const ticket_details = await ticketModel.findOne({_id:ticket_Manager.high_priority[i]})

  if(ticket_details.issueType === "software"){
    const softwareAgent = await agentModel.findOne({major:'software'})
    if(softwareAgent.availability < 5){
      await agentModel.updateOne({_id:softwareAgent._id},{$push:{tickets_queue:ticket_Manager.high_priority[i]},$inc:{availability:1}})
      await ticketModel.updateOne({_id:ticket_details._id},{agent:softwareAgent._id,status:"pending"})
      await ticketmanagerModel.updateOne({Manager_number:1},{$pull:{high_priority:ticket_Manager.high_priority[i]}})
    }
  }
  if(ticket_details.issueType === "hardware"){
    const hardwareAgent = await agentModel.findOne({major:'hardware'})
    if(hardwareAgent.availability < 5){
      await agentModel.updateOne({_id:hardwareAgent._id},{$push:{tickets_queue:ticket_Manager.high_priority[i]},$inc:{availability:1}})
      await ticketModel.updateOne({_id:ticket_details._id},{agent:hardwareAgent._id,status:"pending"})
      await ticketmanagerModel.updateOne({Manager_number:1},{$pull:{high_priority:ticket_Manager.high_priority[i]}})
    }
  }
  if(ticket_details.issueType === "network"){
    const networkAgent = await agentModel.findOne({major:'network'})
    if(networkAgent.availability < 5){
      await agentModel.updateOne({_id:networkAgent._id},{$push:{tickets_queue:ticket_Manager.high_priority[i]},$inc:{availability:1}})
      await ticketModel.updateOne({_id:ticket_details._id},{agent:networkAgent._id,status:"pending"})
      await ticketmanagerModel.updateOne({Manager_number:1},{$pull:{high_priority:ticket_Manager.high_priority[i]}})
    }
  }
}

//loop on medium priority tickets and assign it to agent if he is available
for(let i=0; i <ticket_Manager.medium_priority.length;i++){

  const ticket_details = await ticketModel.findOne({_id:ticket_Manager.medium_priority[i]})

  if(ticket_details.issueType === "software"){
    const softwareAgent = await agentModel.findOne({major:'software'})
    const softwarehelper = await agentModel.findOne({major:'hardware'})
    if(softwareAgent.availability < 5){
      await agentModel.updateOne({_id:softwareAgent._id},{$push:{tickets_queue:ticket_Manager.medium_priority[i]},$inc:{availability:1}})
      await ticketModel.updateOne({_id:ticket_details._id},{agent:softwareAgent._id,status:"pending"})
      await ticketmanagerModel.updateOne({Manager_number:1},{$pull:{medium_priority:ticket_Manager.medium_priority[i]}})
    }
    else if(softwarehelper.availability<5){
      await agentModel.updateOne({_id:softwarehelper._id},{$push:{tickets_queue:ticket_Manager.medium_priority[i]},$inc:{availability:1}})
      await ticketModel.updateOne({_id:ticket_details._id},{agent:softwarehelper._id,status:"pending"})
      await ticketmanagerModel.updateOne({Manager_number:1},{$pull:{medium_priority:ticket_Manager.medium_priority[i]}})
    }
  }
  if(ticket_details.issueType === "hardware"){
    const hardwareAgent = await agentModel.findOne({major:'hardware'})
    const hardwarehelper = await agentModel.findOne({major:'network'})
    if(hardwareAgent.availability < 5){
      await agentModel.updateOne({_id:hardwareAgent._id},{$push:{tickets_queue:ticket_Manager.medium_priority[i]},$inc:{availability:1}})
      await ticketModel.updateOne({_id:ticket_details._id},{agent:hardwareAgent._id,status:"pending"})
      await ticketmanagerModel.updateOne({Manager_number:1},{$pull:{medium_priority:ticket_Manager.medium_priority[i]}})
    }
    else if(hardwarehelper.availability < 5){
      await agentModel.updateOne({_id:hardwarehelper._id},{$push:{tickets_queue:ticket_Manager.medium_priority[i]},$inc:{availability:1}})
      await ticketModel.updateOne({_id:ticket_details._id},{agent:hardwarehelper._id,status:"pending"})
      await ticketmanagerModel.updateOne({Manager_number:1},{$pull:{medium_priority:ticket_Manager.medium_priority[i]}})
    }
  }
  if(ticket_details.issueType === "network"){
    const networkAgent = await agentModel.findOne({major:'network'})
    const networkhelper = await agentModel.findOne({major:'software'})
    if(networkAgent.availability < 5){
      await agentModel.updateOne({_id:networkAgent._id},{$push:{tickets_queue:ticket_Manager.medium_priority[i]},$inc:{availability:1}})
      await ticketModel.updateOne({_id:ticket_details._id},{agent:networkAgent._id,status:"pending"})
      await ticketmanagerModel.updateOne({Manager_number:1},{$pull:{medium_priority:ticket_Manager.medium_priority[i]}})
    }
    else if(networkhelper.availability < 5){
      await agentModel.updateOne({_id:networkhelper._id},{$push:{tickets_queue:ticket_Manager.medium_priority[i]},$inc:{availability:1}})
      await ticketModel.updateOne({_id:ticket_details._id},{agent:networkhelper._id,status:"pending"})
      await ticketmanagerModel.updateOne({Manager_number:1},{$pull:{medium_priority:ticket_Manager.medium_priority[i]}})
    }
  }
}

// low priority

for(let i=0; i <ticket_Manager.low_priority.length;i++){

  const ticket_details = await ticketModel.findOne({_id:ticket_Manager.low_priority[i]})

  if(ticket_details.issueType === "software"){
    const softwareAgent = await agentModel.findOne({major:'software'})
    const shelper = await agentModel.findOne({major:'network'})
    if(softwareAgent.availability < 5){
      await agentModel.updateOne({_id:softwareAgent._id},{$push:{tickets_queue:ticket_Manager.low_priority[i]},$inc:{availability:1}})
      await ticketModel.updateOne({_id:ticket_details._id},{agent:softwareAgent._id,status:"pending"})
      await ticketmanagerModel.updateOne({Manager_number:1},{$pull:{low_priority:ticket_Manager.low_priority[i]}})
    }
    else if(shelper.availability<5){
      await agentModel.updateOne({_id:shelper._id},{$push:{tickets_queue:ticket_Manager.low_priority[i]},$inc:{availability:1}})
      await ticketModel.updateOne({_id:ticket_details._id},{agent:shelper._id,status:"pending"})
      await ticketmanagerModel.updateOne({Manager_number:1},{$pull:{low_priority:ticket_Manager.low_priority[i]}})
    }
  }
  if(ticket_details.issueType === "hardware"){
    const hardwareAgent = await agentModel.findOne({major:'hardware'})
    const hhelper = await agentModel.findOne({major:'software'})
    if(hardwareAgent.availability < 5){
      await agentModel.updateOne({_id:hardwareAgent._id},{$push:{tickets_queue:ticket_Manager.low_priority[i]},$inc:{availability:1}})
      await ticketModel.updateOne({_id:ticket_details._id},{agent:hardwareAgent._id,status:"pending"})
      await ticketmanagerModel.updateOne({Manager_number:1},{$pull:{low_priority:ticket_Manager.low_priority[i]}})
    }
   else if(hhelper.availability < 5){
      await agentModel.updateOne({_id:hhelper._id},{$push:{tickets_queue:ticket_Manager.low_priority[i]},$inc:{availability:1}})
      await ticketModel.updateOne({_id:ticket_details._id},{agent:hhelper._id,status:"pending"})
      await ticketmanagerModel.updateOne({Manager_number:1},{$pull:{low_priority:ticket_Manager.low_priority[i]}})
    }
  }
  if(ticket_details.issueType === "network"){
    const networkAgent = await agentModel.findOne({major:'network'})
    const nhelper = await agentModel.findOne({major:'hardware'})
    if(networkAgent.availability < 5){
      await agentModel.updateOne({_id:networkAgent._id},{$push:{tickets_queue:ticket_Manager.low_priority[i]},$inc:{availability:1}})
      await ticketModel.updateOne({_id:ticket_details._id},{agent:networkAgent._id,status:"pending"})
      await ticketmanagerModel.updateOne({Manager_number:1},{$pull:{low_priority:ticket_Manager.low_priority[i]}})
    }
    else if(nhelper.availability < 5){
      await agentModel.updateOne({_id:nhelper._id},{$push:{tickets_queue:ticket_Manager.low_priority[i]},$inc:{availability:1}})
      await ticketModel.updateOne({_id:ticket_details._id},{agent:nhelper._id,status:"pending"})
      await ticketmanagerModel.updateOne({Manager_number:1},{$pull:{low_priority:ticket_Manager.low_priority[i]}})
    }
  }
}
return res.json({mssg:"Ticket has been created"})

}catch(err){
  console.log(err)
  return res.json({mssg:err})
}

}

// Get automated solution
module.exports.automated = async (req,res)=>{
  const{subCategory} = req.params
  try{
    const sol = await automatedModel.findOne({subCategory})
    if(!sol)return res.json("automated solution is Not Avalible")
    return res.json(sol.automatedWorkflow)
  }catch(err){
    console.log(err)
    return res.json({mssg:"Error while retriving solution"})
  }
}
// user rating for the ticket
module.exports.rating = async(req,res)=>{
  const{ticketid} = req.params
  const{ticket_rating} = req.body
  try{
    if(!ticket_rating)return res.json({mssg:"Enter ticket rating"})
    await ticketModel.updateOne({_id:ticketid},{ticket_rating})
    return res.json({mssg:"Rating is Sent"})
  }catch(err){
    console.log(err)
    return res.json({mssg:"Error in rating"})
  }
}

//get all user tickets
module.exports.gettickets = async(req,res)=>{
  try{

  const tickets = await ticketModel.find({user:req.user._id})
  if(tickets.length === 0){
    return res.json({mssg:"No tickets"})}
    else
  return res.json(tickets)
}catch(err){
  console.log(err)
  return res.json({mssg:"Error while retriving data"})
}
}


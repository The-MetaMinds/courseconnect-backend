import express from "express";
const router = express.Router();


const courses = [
    {id : 1, name: 'CSC101'},
    {id : 2, name: 'CSC102'},
    {id : 3, name: 'MTH101'}
]

router.get('/api/courses/:year/:month', (req, res) => {
    res.send(req.params)
})


router.get('/api/courses', (req, res) => {
    res.send(courses);
})


router.get('/api/courses/:id', (req, res) => {
    const course = courses.find(course => course.id  === parseInt(req.params.id));
    if(!course) return res.status(404).send("Invalid ID")
    return res.send(course);
})

router.post('/api/courses', (req, res) => {
    const {error} = validateCourse(req.body)
    
    if(error) return res.status(400).send(error.details[0].message);

    const course = {
        id : courses.length +1,
        name : req.body.name
    }
    courses.push(course);
    res.send(course)
})

router.put('/api/courses/:id', (req, res) => {
    //look up the course
    //return 404 if it doesn't exist
    const course = courses.find(course => course.id  === parseInt(req.params.id));
    if(!course) return res.status(404).send("Invalid ID")


    //validate
    //if invalid return 400
    const {error} = validateCourse(req.body) 
    
    if(error) return res.status(400).send(error.details[0].message);

    
    //update the course
    //return the updated course
    course.name = req.body.name;
    res.send(course)
})

router.delete('/api/courses/:id', (req, res) => {
    //look up the course
    //not exist return 404
    const course = courses.find(course => course.id  === parseInt(req.params.id));
    if(!course) return res.status(404).send("Invalid ID")

    //delete
    const index= courses.indexOf(course);
    courses.splice(index, 1)

    //return course
    res.send(course)
})

function validateCourse(course){
    const schema = Joi.object({
        name : Joi.string().min(3).required()
    });

    return schema.validate(course)
}

export {router}
// step-15__________________________________________________________________________________3

const express = require('express');
const app = express();
const cors = require('cors');

const jwt = require('jsonwebtoken');  //step-40_____________________________________________3

require('dotenv').config();

const port = process.env.PORT || 5000;

// middleware

app.use(cors());
app.use(express.json());



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ymvr3sa.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    // step-16_________________________________________________________________________________1

    const userCollection = client.db("bistroDb").collection("users");  //step-35_______________1
    const menuCollection = client.db("bistroDb").collection("menu");
    const reviewsCollection = client.db("bistroDb").collection("reviews");  //step-17__________2

    const cartCollection = client.db("bistroDb").collection("carts"); //step-28________________1

    // jwt api

     app.post('/jwt', async(req, res)=>{      //step-41________________________________________1
        const user = req.body;
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'});
        res.send({token});
     })

    //  middleware

    const verifyToken = (req, res, next)=>{                  //step-42__________________________1
      //  console.log('Inside jwt',req.headers.authorization);
       if(!req.headers.authorization){
          return res.status(401).send({message:'unauthorized access'});
       }
       const token = req.headers.authorization.split(' ')[1];
       jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{
         if(err){
            return res.status(401).send({message:'unauthorized access'});
         }
         req.decoded = decoded;
         next();
       })
       
    }

    // step-44_____________________________________________________________________________1

        // use verifyToken admin after verifyToken

       const verifyAdmin = async(req, res, next)=>{
         const email = req.decoded.email;
         const query = {email: email};
         const user = await userCollection.findOne(query);
         const isAdmin = user?.role === 'admin';
         if(!isAdmin){
            return res.status(403).send({message: 'Forbidden access'});
         }
         next();
       }

    // step-43______________________________________________________________________________1

    app.get('/users/admin/:email',verifyToken, async(req, res)=>{
         const email = req.params.email;
         if(email !== req.decoded.email){
            return res.status(403).send({message: 'Forbidden access'});
         }
         const query = {email: email};
         const user = await userCollection.findOne(query);
         let admin = false;
         if(user){
            admin = user?.role === 'admin';
         }
         res.send({admin});
    })

    // user related api

    app.get('/users', verifyToken, verifyAdmin, async(req, res)=>{
        // console.log(req.headers.authorization); step-41_____________________________________4
        const result = await userCollection.find().toArray();  //step-38_______________________3
        res.send(result);
    })

    //  step-35_________________________________________________________________________________2
    app.post('/users', async(req, res)=>{
        const user = req.body;
        const query = {email: user.email}; //step-37____________________________________________1
        const existingUser = await userCollection.findOne(query); //step-37_____________________2
        if(existingUser){
          return res.send({message: 'user already exists',insertedId: null}) //step-37__________3
        }
        const result = await userCollection.insertOne(user);
        res.send(result);
    });

    // admin

    app.patch('/users/admin/:id',verifyToken, verifyAdmin, async(req, res)=>{   //step-39_______________________3
       const id = req.params.id;
       const filter = {_id: new ObjectId(id)};
       const updateDoc = {
        $set: {
            role: 'admin'
        }
       }
       const result = await userCollection.updateOne(filter, updateDoc);
       res.send(result);
    })

    // admin section user related api delete

    app.delete('/users/:id',verifyToken, verifyAdmin, async(req, res) =>{  //step-39_______________________1
        const id = req.params.id;
        const query = {_id: new ObjectId(id)};
        const result = await userCollection.deleteOne(query);
        res.send(result);
    })


    // menu related api

    app.get('/menu', async(req, res)=>{
        const result = await menuCollection.find().toArray();
        res.send(result);
    });

    // step-48_____________________________________________________________________3
    //  add item api 
    app.post('/menu',verifyToken, verifyAdmin, async(req, res)=>{
      const item = req.body;
      const result = await menuCollection.insertOne(item);
      res.send(result);
    })

    // step-16_________________________________________________________________________________1

    // step-17_________________________________________________________________________________1

    app.get('/reviews', async(req, res)=>{
      const result = await reviewsCollection.find().toArray();
      res.send(result);
    })

    // step-17_________________________________________________________________________________2

    // step-30_________________________________________________________________________________1
    //  cartCollection-2 shopping cart add api
      
     app.get('/carts', async(req, res)=>{
       const email = req.query.email; //step-31-1
       const query = {email: email};  //step-31-2
       const result = await cartCollection.find(query).toArray();
       res.send(result);
     })

    // step-28_________________________________________________________________________________2

    // cart collection

    app.post('/carts', async(req, res)=>{
      const cartItem = req.body;
      const result = await cartCollection.insertOne(cartItem);
      res.send(result);
    })

    // step-28_________________________________________________________________________________2

    // step-34_________________________________________________________________________________2

    app.delete('/carts/:id', async(req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Hello from Bistro Boss Server!')
})

app.listen(port, () => {
    console.log(`Bistro Boss Server is running on port: ${port}`)
})
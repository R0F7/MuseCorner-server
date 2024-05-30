const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')

const app = express();
const port = process.env.PORT || 5000


const corsOptions = {
    origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'https://blog-website-497d3.web.app',
        'https://blog-website-497d3.firebaseapp.com',
        'https://musecorner.netlify.app',
    ],
    credentials: true,
    optionSuccessStatus: 200,
}

//cookieOption 
const cookieOption = {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    secure: process.env.NODE_ENV === "production" ? true : false,
}

//middleware
app.use(cors(corsOptions))
app.use(express.json())
app.use(cookieParser())


const verifyToken = (req, res, next) => {
    const token = req?.cookies?.token

    if (!token) {
        return res.status(401).send({ message: 'not authorized' })
    }

    jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: "unauthorized access" })
        }
        req.user = decoded;
        next();
    })
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wezoknx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
        const blogCollection = client.db('MuseCornerDB').collection('blog')
        const commentCollection = client.db('MuseCornerDB').collection('comment')
        const wishlistCollection = client.db('MuseCornerDB').collection('wishlist')

        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        app.get('/blog', async (req, res) => {
            const result = await blogCollection.find().sort({ createdAt: -1 }).toArray()
            res.send(result)
        })

        app.post('/jwt', async (req, res) => {
            const user = req.body
            // console.log('user for token', user);

            const token = jwt.sign(user, process.env.TOKEN_SECRET, { expiresIn: '1h' })
            res
                .cookie('token', token, cookieOption)
                .send({ success: true })
        })

        app.post('/logout', async (req, res) => {
            const user = req.body;
            // console.log('logging out', user);
            res.clearCookie('token', { ...cookieOption, maxAge: 0 }).send({ success: true })
        })

        app.get('/all-blogs', async (req, res) => {
            const result = await blogCollection.find().toArray()
            res.send(result)
        })

        app.get('/categories', async (req, res) => {
            const { category } = req.query;
            const result = await blogCollection.find({ category: category }).toArray()
            res.send(result)
        })

        app.get('/search', async (req, res) => {
            const { title } = req.query;
            // console.log(title)
            const result = await blogCollection.find({ title: { $regex: title, $options: 'i' } }).toArray()
            // console.log(result)
            res.send(result)
        });

        app.get('/details/:id', async (req, res) => {
            const id = req.params
            const query = { _id: new ObjectId(id) }
            const result = await blogCollection.findOne(query)
            res.send(result)
        })

        app.get('/update', verifyToken, async (req, res) => {

            if (req.user.email !== req.query.email) {
                return res.status(403).send({ message: 'forbidden access' })
            }

            const { id } = req.query
            const { email } = req.query
            const query = { _id: new ObjectId(id), user_email: email }
            const result = await blogCollection.findOne(query)
            res.send(result)
        })

        app.get('/comments/:id', async (req, res) => {
            const { id } = req.params
            // console.log(id);
            const query = { blogId: id }
            const result = await commentCollection.find(query).toArray()
            res.send(result)
        })

        app.get('/blog-sorting', async (req, res) => {
            const result = await blogCollection.find().toArray()
            res.send(result)
        })

        app.get('/wishlist/:email', verifyToken, async (req, res) => {
            // console.log( req.user.email , req.params.email);

            if (req.user.email !== req.params.email) {
                return res.status(403).send({ message: 'forbidden access' })
            }

            const { email } = req.params
            const result = await wishlistCollection.find({ user_email: email }).toArray()
            res.send(result)
        })

        app.post('/blog', verifyToken, async (req, res) => {
            const info = req.body;
            const result = await blogCollection.insertOne(info)
            res.send(result)
        })

        app.post('/comments', async (req, res) => {
            const info = req.body;
            const result = await commentCollection.insertOne(info)
            res.send(result)
        })

        app.post('/wishlist', async (req, res) => {
            const info = req.body
            const result = await wishlistCollection.insertOne(info)
            res.send(result)
        })

        app.put('/blog/:id', verifyToken, async (req, res) => {
            const id = req.params
            const doc = req.body
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true }
            const updatedDoc = {
                $set: {
                    title: doc.title,
                    image: doc.image,
                    short_description: doc.short_description,
                    long_description: doc.long_description,
                    category: doc.category,
                    updatedAt: doc.updatedAt,
                }
            }
            const result = await blogCollection.updateOne(filter, updatedDoc, options)
            res.send(result)
        })

        app.delete('/wishlist-remove', async (req, res) => {
            const { id } = req.query
            const { email } = req.query
            const query = { blogId: id, user_email: email }
            const result = await wishlistCollection.deleteOne(query)
            res.send(result)
        })


        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Alive blog website server')
})

app.listen(port, () => {
    console.log(`Blog Website server run on port:${port}`);
})

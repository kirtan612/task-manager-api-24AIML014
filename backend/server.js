const express = require("express");

const app = express();
const PORT = 5000;

app.use(express.json());

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
    next();
});

let users = [
    { id: 1, name: "Kirtan " },
    { id: 2, name: "Jogani" }
];

app.get("/users", (req, res) => {
    res.status(200).json(users);
});

app.post("/users", (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({
            message: "Name is required"
        });
    }

    const newUser = {
        id: users.length + 1,
        name
    };

    users.push(newUser);

    res.status(201).json({
        message: "User added successfully",
        user: newUser
    });
});

app.put("/users/:id", (req, res) => {
    const id = parseInt(req.params.id);

    const user = users.find(u => u.id === id);

    if (!user) {
        return res.status(404).json({
            message: "User not found"
        });
    }

    user.name = req.body.name;

    res.status(200).json({
        message: "User updated successfully",
        user
    });
});

app.delete("/users/:id", (req, res) => {
    const id = parseInt(req.params.id);

    const index = users.findIndex(u => u.id === id);

    if (index === -1) {
        return res.status(404).json({
            message: "User not found"
        });
    }

    users.splice(index, 1);

    res.status(200).json({
        message: "User deleted successfully"
    });
});

app.use((err, req, res, next) => {
    console.error(err.stack);

    res.status(500).json({
        error: "Something went wrong"
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
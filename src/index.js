import dotenv from "dotenv";
import { app } from "./app.js";

dotenv.config({
  path: "./.env",
});

const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`Server is running at PORT: ${port}`);
});

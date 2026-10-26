import app, { jsonBodyLimit } from "./app";
import { connectDB } from "./server";
import colors from "colors";

const port = process.env.PORT || 1206;

// Iniciar el servidor
async function start() {
  await connectDB();

  app.listen(port, () => {
    console.log(colors.cyan.bold(`Server listening on port ${port}`));
    console.log(colors.gray(`Body JSON limit: ${jsonBodyLimit}`));
  });
}

start();

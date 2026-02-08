import "dotenv/config";
import app from "./app.js";
import { testSupabaseConnection } from "./db/supabase.test.js";


const PORT = process.env.PORT || 3000;

testSupabaseConnection()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`app is listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.log("Supabase Connection Error");
    process.exit(1);
  });

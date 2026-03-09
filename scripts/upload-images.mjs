import { v2 as cloudinary } from "cloudinary";
import Airtable from "airtable";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY,
}).base("appzynj6dYXpWEoKi");

const RECIPES_TABLE = "tblcDuujfu1rokjSU";

const recipes = [
  { id: "recZ5BnCfnA6x9Z0p", name: "Homemade French Fries", file: "oven-baked-homemade-french-fries.jpeg" },
  { id: "recNz6uEGYays2DyI", name: "Best Hamburger", file: "best-hamburger-recipe-11.png" },
  { id: "recUbGaVbK3F2rbEf", name: "Sweet Potato Fries", file: "28COOKING-SWEET-POTATO-FRIES1-ju.jpeg" },
  { id: "reclLLoXY9HrpI6PJ", name: "Moroccan Lentil Soup", file: "moroccan-lentil-sweet-potato-sou.jpeg" },
  { id: "recBhqTJ26SQHTe0t", name: "Shakshuka", file: "shakshuka-recipe-1160x1578.jpeg" },
  { id: "rec6BCvuDL5UmqtUB", name: "Tini Mac and Cheese", file: "tini-mac-cheese-4894w.jpeg" },
  { id: "recPn0zbWJNcJp3eq", name: "Moroccan Couscous", file: "moroccan-couscous-2.jpeg" },
  { id: "recUJkOsfmn96nIZt", name: "Basic Vinaigrette", file: "basic-vinaigrette-recipe-2.jpeg" },
  { id: "rec4AtZ6If2RbyLM7", name: "Best Goulash", file: "goulash-lead-64de8d20c2d14.jpeg" },
  { id: "recChWribt3DpjeBA", name: "Chicken Teriyaki", file: "1st-image-Teriyaki-Chicken.jpeg" },
  { id: "recqieZ0dvyXThQKq", name: "Blueberry Pancakes", file: "Taking-a-Bite-of-Blueberry-Panca.jpeg" },
  { id: "rectPt0G71Ts66w0l", name: "Japanese Crepe Cone", file: "EG8_EP13_Japanese-Crepe-Cone.jpeg" },
  { id: "recaNlrpC6F2fJSUm", name: "Cumin Chicken with Apricots", file: "fy2xp82bqfuy98feb4oh.jpeg" },
];

const DOWNLOADS = "/Users/michaelhaslim/Downloads";

async function run() {
  for (const recipe of recipes) {
    const filePath = `${DOWNLOADS}/${recipe.file}`;
    console.log(`Uploading: ${recipe.name}...`);

    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: "julies-cookbook",
        public_id: recipe.file.replace(/\.[^.]+$/, ""),
        overwrite: true,
      });

      const imageUrl = result.secure_url;
      console.log(`  -> ${imageUrl}`);

      await base(RECIPES_TABLE).update(recipe.id, {
        "Image URL": imageUrl,
      });
      console.log(`  -> Airtable updated`);
    } catch (err) {
      console.error(`  ERROR: ${err.message}`);
    }
  }
  console.log("\nDone! All images uploaded and Airtable updated.");
}

run();

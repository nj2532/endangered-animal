/* 
We use `v-model` to bind form inputs like animal name, location, category, quantity, and description. 
Conditional rendering with `v-if` controls page views (home vs form), and `v-for` is used to display animal records in a table. 
We also use computed properties to filter the data by search keyword and selected category. 
The `methods` section handles logic for uploading images (converted to base64), editing records, resetting the form, and switching between add and update modes.
For backend integration, we use Firebase Firestore to store and manage animal data in the cloud. 
We initialize Firebase with a config object, then use `addDoc`, `updateDoc`, `deleteDoc`, and `getDocs` to interact with the `animals` collection. 
On app mount, we load all animal entries and store them in a reactive array. 
Each time a user adds, updates, or deletes a record, the list refreshes automatically from Firestore. 
*/

// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Initialize Firebase app with Firestore
const firebaseConfig = {
  apiKey: "AIzaSyD_rTwD3aGjREuctSmlqL1BLRvzB0nSteg",
  authDomain: "endangered-animal-database.firebaseapp.com",
  projectId: "endangered-animal-database"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const animalsRef = collection(db, "animals");

// Main Vue app
const app = {
  data() {
    return {
      currentPage: "home", // Controls which view is shown
      animalName: "",
      location: "",
      population: "",
      description: "",
      category: "",
      imageBase64: "", // Base64 image string for preview and storage
      animals: [], // List of animal records
      editIndex: null,
      editDocId: null,
      searchQuery: "",
      selectedCategory: ""
    };
  },
  mounted() {
    // Load animals from Firestore when app starts
    this.loadAnimals();
  },
  computed: {
    // Filters animal data based on search and category
    filteredAnimals() {
      const query = this.searchQuery.toLowerCase();
      return this.animals.filter(animal => {
        const matchText =
          animal.name.toLowerCase().includes(query) ||
          animal.location.toLowerCase().includes(query) ||
          animal.description.toLowerCase().includes(query);
        const matchCategory =
          this.selectedCategory === "" || animal.category === this.selectedCategory;
        return matchText && matchCategory;
      });
    }
  },
  methods: {
    // Convert uploaded image to base64 for preview and storage
    handleImageUpload(event) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.imageBase64 = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    },

    // Load all animal entries from Firestore
    async loadAnimals() {
      const snapshot = await getDocs(animalsRef);
      this.animals = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        data.id = docSnap.id;
        this.animals.push(data);
      });
    },

    // Add new animal or update existing one
    async addAnimal() {
      if (
        this.animalName &&
        this.location &&
        this.category &&
        this.population !== "" &&
        this.description &&
        this.imageBase64
      ) {
        const animalData = {
          name: this.animalName,
          location: this.location,
          population: this.population,
          description: this.description,
          category: this.category,
          image: this.imageBase64
        };

        try {
          if (this.editIndex === null) {
            // Add new entry
            await addDoc(animalsRef, animalData);
          } else {
            // Update existing entry
            const docRef = doc(db, "animals", this.editDocId);
            await updateDoc(docRef, animalData);
          }

          await this.loadAnimals();
          this.resetForm();
        } catch (err) {
          console.error("Firestore error:", err);
          alert("Failed to save to database.");
        }
      } else {
        alert("Please complete all fields and upload an image.");
      }
    },

    // Delete an animal entry from Firestore
    async deleteAnimal(index) {
      const animal = this.animals[index];
      if (confirm(`Delete "${animal.name}"?`)) {
        const docRef = doc(db, "animals", animal.id);
        await deleteDoc(docRef);
        await this.loadAnimals();
        if (this.editIndex === index) {
          this.resetForm();
        }
      }
    },

    // Load selected entry into form for editing
    editAnimal(index) {
      const animal = this.animals[index];
      this.animalName = animal.name;
      this.location = animal.location;
      this.population = animal.population;
      this.description = animal.description;
      this.category = animal.category;
      this.imageBase64 = animal.image;
      this.editIndex = index;
      this.editDocId = animal.id;
    },

    // Reset form fields to default
    resetForm() {
      this.animalName = "";
      this.location = "";
      this.population = "";
      this.description = "";
      this.category = "";
      this.imageBase64 = "";
      this.editIndex = null;
      this.editDocId = null;
    }
  }
};

// Mount Vue app to the DOM
Vue.createApp(app).mount("#app");

const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const {
  getAllClients,
  createClient,
  getClient,
  updateClient,
  toggleClientStatus,
  deleteClient
} = require("../controllers/clientController");

router.use(verifyToken);

router.route("/")
  .get(getAllClients)
  .post(createClient);

router.route("/:id")
  .get(getClient)
  .put(updateClient)
  .delete(deleteClient);

router.route("/:id/status")
  .patch(toggleClientStatus);

module.exports = router;
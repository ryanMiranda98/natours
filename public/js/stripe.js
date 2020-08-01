import axios from "axios";
import { showAlert } from "./alerts";
const stripe = Stripe(
  "pk_test_51HB4MwFsdxkHbxOdfdRrqKd6RUR1wxIgvCPQoiVweDVA9mpxWFyfU0R0ZoyQ6P3uHdOQzBGFzFHKevr9OS2fBHqf00XLcKcTTu"
);

export const bookTour = async (tourId) => {
  try {
    // Get checkout session from api
    const session = await axios({
      method: "GET",
      url: `http://localhost:5000/api/v1/bookings/checkout-session/${tourId}`,
    });
    console.log(session);

    // Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err.response.data.message);
    showAlert("error", "Error logging out! Try again.");
  }
};

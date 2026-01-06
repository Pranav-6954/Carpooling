import React, { useState, useEffect, useRef } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/jwt";

// Make sure to call loadStripe outside of a component’s render to avoid
// recreating the Stripe object on every render.
const stripePromise = loadStripe("pk_test_51Si6Y5QtS4SHV1lQktzwaw0AxvKrxjSdYRwz7fYlUFwxArsF3IE97rZrR5lW9j9A605BVwJaM4HkoUxsnMlssXZu00R6j8kEYZ");

const MockCheckoutForm = ({ amount, bookingId }) => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate processing delay
        setTimeout(async () => {
            setMessage("Payment Authorized. Finalizing your booking...");

            if (bookingId) {
                try {
                    // Call Simulate Endpoint
                    await apiFetch("/api/payment/simulate", {
                        method: "POST",
                        body: JSON.stringify({ bookingId: bookingId, amount: amount })
                    });

                    setMessage("Journey Secured! Redirecting... (Demo Mode)");
                    setTimeout(() => navigate("/booking-success", { state: { booking: { id: bookingId }, transactionId: "DEMO-TRX-" + Date.now() } }), 1500);
                } catch (err) {
                    console.error("Simulation failed:", err);
                    setMessage("Simulated payment failed, but redirecting anyway...");
                    setTimeout(() => navigate("/booking-success", { state: { booking: { id: bookingId }, transactionId: "DEMO-ERR-TRX" } }), 1500);
                }
            } else {
                setTimeout(() => navigate("/booking-success", { state: { booking: { id: "DEMO-ID" }, transactionId: "DEMO-TRX-" + Date.now() } }), 1500);
            }
        }, 1500);
    };

    return (
        <form onSubmit={handleSubmit} className="card glass animate-slide-up" style={{ maxWidth: "550px", margin: "2rem auto", padding: "2.5rem" }}>
            <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
                <div style={{ display: 'inline-flex', padding: '12px', background: 'rgba(var(--primary-rgb), 0.1)', borderRadius: '16px', color: 'var(--primary)', marginBottom: '1rem', fontSize: '1.5rem' }}>💳</div>
                {/* Visual indicator that this is a simulated environment if needed, but keeping it looking real for the video */}
                <h2 style={{ marginBottom: "0.5rem", letterSpacing: '-0.5px' }}>Secure Payment</h2>
                <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>Complete transfer of <strong style={{ color: "var(--primary)", fontWeight: 800 }}>₹{amount}</strong></p>
            </div>

            <div style={{ padding: '2rem', background: 'transparent', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '2rem' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: '0.5rem', display: 'block', letterSpacing: '0.05em' }}>Card Number</label>
                    <input
                        type="text"
                        placeholder="0000 0000 0000 0000"
                        className="input"
                        required
                    />
                </div>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: '0.5rem', display: 'block', letterSpacing: '0.05em' }}>Expiration</label>
                        <input
                            type="text"
                            placeholder="MM / YY"
                            className="input"
                            required
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: '0.5rem', display: 'block', letterSpacing: '0.05em' }}>CVC</label>
                        <input
                            type="text"
                            placeholder="123"
                            className="input"
                            required
                        />
                    </div>
                </div>
            </div>

            <button disabled={isLoading} className="btn btn-primary" style={{ width: "100%", padding: "1.25rem", fontSize: "1.2rem", letterSpacing: '0.5px' }}>
                {isLoading ? "Processing Transaction..." : `Pay ₹${amount} & Confirm`}
            </button>

            {message && (
                <div className={`badge ${message.includes("Failed") ? "badge-danger" : "badge-success"}`} style={{ display: 'block', marginTop: '1.5rem', textAlign: 'center', padding: '0.75rem' }}>
                    {message}
                </div>
            )}

            <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '1.5rem' }}>
                🔒 Your transaction is protected by industry-standard SSL encryption. RideShare does not store your card details.
            </p>
        </form>
    );
};

const CheckoutForm = ({ amount }) => {
    const stripe = useStripe();
    const elements = useElements();
    const navigate = useNavigate();
    const { bookingId } = useLocation().state || {};

    const [message, setMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) return;
        setIsLoading(true);

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: { return_url: window.location.origin },
            redirect: "if_required"
        });

        if (error) {
            setMessage(error.message);
            setIsLoading(false);
            return;
        }

        // If we reach here, Stripe has validated the card and started the payment session.
        // Now we actually confirm the intent.

        if (paymentIntent && paymentIntent.status === "succeeded") {
            setMessage("Payment Authorized. Finalizing your booking...");
            if (bookingId) {
                try {
                    // Finalize payment entity
                    await apiFetch(`/api/payment/confirm`, {
                        method: "POST",
                        body: JSON.stringify({
                            paymentIntentId: paymentIntent.id,
                            paymentMethodId: paymentIntent.payment_method
                        })
                    });

                    setMessage("Journey Secured! Redirecting...");
                    // Pass explicit navigation state to the success page
                    // Pass explicit navigation state to the success page with Transaction ID
                    setTimeout(() => navigate("/booking-success", {
                        state: {
                            booking: { id: bookingId },
                            transactionId: paymentIntent.id
                        }
                    }), 1500);
                } catch (e) {
                    console.error("Finalization error:", e);
                    setMessage("Payment succeeded but booking update failed. Contact support.");
                }
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="card glass animate-slide-up" style={{ maxWidth: "550px", margin: "2rem auto", padding: "2.5rem" }}>
            <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
                <div style={{ display: 'inline-flex', padding: '12px', background: 'rgba(var(--primary-rgb), 0.1)', borderRadius: '16px', color: 'var(--primary)', marginBottom: '1rem', fontSize: '1.5rem' }}>🛡️</div>
                <h2 style={{ marginBottom: "0.5rem", letterSpacing: '-0.5px' }}>Payment Authentication</h2>
                <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>Final stage for authorized transfer of <strong style={{ color: "var(--primary)", fontWeight: 800 }}>₹{amount}</strong></p>
            </div>

            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '1.5rem', minHeight: '300px' }}>
                <PaymentElement options={{ layout: { type: 'tabs', defaultCollapsed: false } }} />
            </div>

            <button disabled={isLoading || !stripe || !elements} className="btn btn-primary" style={{ width: "100%", padding: "1.25rem", fontSize: "1.2rem", letterSpacing: '0.5px' }}>
                {isLoading ? "Validating & Confirming..." : `Confirm Payment & Book Seat (₹${amount})`}
            </button>

            {message && (
                <div className={`badge ${message.includes("Failed") ? "badge-danger" : "badge-success"}`} style={{ display: 'block', marginTop: '1.5rem', textAlign: 'center', padding: '0.75rem' }}>
                    {message}
                </div>
            )}

            <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '1.5rem' }}>
                🔒 Your transaction is protected by industry-standard SSL encryption. RideShare does not store your card details.
            </p>
        </form>
    );
}

export default function PaymentPage() {
    const [clientSecret, setClientSecret] = useState("");
    const [error, setError] = useState(null);
    const [demoMode, setDemoMode] = useState(false); // Fallback mode
    const location = useLocation();
    const amount = location.state?.amount || 100;
    const bookingId = location.state?.bookingId;

    const initialized = useRef(false);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        // If something goes wrong, waiting too long, etc., we fallback to demo mode
        // REMOVED AbortController to prevents race conditions in React StrictMode
        // const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            // controller.abort();
            setError("Connection timed out. Please check your internet or backend server.");
        }, 30000);

        apiFetch("/api/payment/create-payment-intent", {
            method: "POST",
            body: JSON.stringify({ amount: amount, bookingId: bookingId }),
            // signal: controller.signal
        })
            .then((data) => {
                clearTimeout(timeoutId);
                if (data.clientSecret) {
                    setClientSecret(data.clientSecret);
                } else {
                    // Fallback if no secret
                    setError("Backend returned no client secret. Check API response.");
                    // setDemoMode(true);
                    // setClientSecret("DEMO");
                }
            })
            .catch(err => {
                clearTimeout(timeoutId);
                // Fallback on error
                console.warn("Payment API failed:", err);
                setError(`Failed to connect to Payment Server: ${err.message}.`);
                // DISABLED: Do not switch to demo mode
            });

        return () => {
            clearTimeout(timeoutId);
            // controller.abort();
        };
    }, [amount, bookingId]);

    const [isDark, setIsDark] = useState(document.body.classList.contains("dark-mode"));

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDark(document.body.classList.contains("dark-mode"));
        });
        observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
        return () => observer.disconnect();
    }, []);

    const appearance = {
        theme: isDark ? 'night' : 'stripe',
        variables: isDark ? {
            colorPrimary: '#6366f1',
            colorBackground: '#1e293b',
            colorText: '#f1f5f9',
            colorDanger: '#ef4444',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            borderRadius: '12px',
        } : {
            colorPrimary: '#6366f1',
            colorBackground: '#ffffff',
            colorText: '#0f172a', // Very dark for better readability
            colorTextSecondary: '#334155',
            colorDanger: '#ef4444',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            borderRadius: '12px',
            borderColor: '#e2e8f0',
        }
    };

    const options = {
        clientSecret,
        appearance
    };

    return (
        <div className="container" style={{ paddingTop: "4rem", paddingBottom: "5rem" }}>
            {/* Show Error if exists */}
            {error ? (
                <div style={{ textAlign: "center", marginTop: "8rem" }}>
                    <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
                    <h3 className="text-danger" style={{ marginBottom: "1rem" }}>Payment System Error</h3>
                    <p style={{ color: "var(--text-muted)", maxWidth: "500px", margin: "0 auto", marginBottom: "2rem" }}>
                        {error}
                    </p>
                    <button className="btn btn-secondary" onClick={() => window.location.reload()}>Retry Connection</button>
                    <button className="btn btn-ghost" style={{ marginLeft: "1rem" }} onClick={() => setDemoMode(true)}>Switch to Demo Mode</button>
                </div>
            ) : demoMode ? (
                <MockCheckoutForm amount={amount} bookingId={bookingId} />
            ) : !clientSecret ? (
                <div style={{ textAlign: "center", marginTop: "8rem", display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid rgba(var(--primary-rgb), 0.1)', borderTop: '3px solid var(--primary)', borderRadius: '50%', marginBottom: '1.5rem' }}></div>
                    <h3 style={{ marginBottom: '0.5rem', letterSpacing: '-0.5px' }}>Establishing Secure Connection</h3>
                    <p style={{ color: 'var(--text-muted)', maxWidth: '300px', margin: '0 auto', fontSize: '0.9rem' }}>Synchronizing with Stripe PCI-compliant servers...</p>

                    <div style={{ marginTop: '2rem', width: '200px', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                        <div className="animate-shimmer" style={{ width: '100%', height: '100%', background: 'linear-gradient(90deg, transparent, var(--primary), transparent)', transform: 'translateX(-100%)' }}></div>
                    </div>
                </div>
            ) : (
                <Elements options={options} stripe={stripePromise}>
                    <CheckoutForm amount={amount} />
                </Elements>
            )}
        </div>
    );
}

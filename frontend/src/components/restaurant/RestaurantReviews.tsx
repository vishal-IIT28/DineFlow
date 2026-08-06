/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import api from "../../lib/api.ts";

interface RestaurantReviewsProps {
    restaurantId: string;
}

export default function RestaurantReviews({ restaurantId }: RestaurantReviewsProps) {
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            if (!restaurantId) return;
            try {
                setLoading(true);
                const response = await api.get(`/restaurants/${restaurantId}/reviews`);
                setReviews(response.data?.data || response.data || []);
            } catch (error) {
                console.error("Error fetching restaurant reviews:", error);
                setReviews([]);
            } finally {
                setLoading(false);
            }
        };

        fetchReviews();
    }, [restaurantId]);

    return (
        <section className="space-y-8 pt-6 border-t border-outline-variant/10 text-left">
            <h3 className="font-display text-xl font-semibold text-primary">Guest Experiences</h3>

            <div className="space-y-6">
                {loading ? (
                    <div className="py-6 flex justify-center">
                        <div className="w-6 h-6 border-2 border-outline-variant/30 border-t-secondary rounded-full animate-spin"></div>
                    </div>
                ) : reviews.length === 0 ? (
                    <p className="text-xs text-black/55/80 italic">No reviews yet.</p>
                ) : (
                    reviews.map((r: any) => (
                        <div key={r._id} className="pb-6 border-b border-outline-variant/10 last:border-b-0 space-y-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-medium text-primary">{r.user?.name || "Guest"}</h4>
                                    <span className="text-xs text-black/55">
                                        Visited {new Date(r.visitedDate || r.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex items-center gap-0.5 text-secondary">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            size={12}
                                            fill={i < r.rating ? "currentColor" : "none"}
                                            className={i < r.rating ? "" : "text-outline-variant"}
                                        />
                                    ))}
                                </div>
                            </div>
                            <p className="text-xs text-black/55 max-w-lg leading-relaxed">{r.comment}</p>
                        </div>
                    ))
                )}
            </div>
        </section>
    );
}

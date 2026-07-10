// api/update-gallery-assets.js
// Securely updates the gallery_assets table using the service role key

module.exports = async (req, res) => {
  // Enable CORS
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json"
  };

  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value);
  }

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const SUPABASE_URL = process.env.SUPABASE_URL || "https://kivfatgytkjqoreltuyu.supabase.co";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      return res.status(500).json({ error: { message: "Supabase service role key is not configured on server" } });
    }

    const newAssets = [
      {
        id: 1,
        title: "Main Poster",
        description: "Gravity Studios main launch and creative ecosystem showcase.",
        src: `${SUPABASE_URL}/storage/v1/object/public/gallery-assets/MainPoster.jpeg`,
        fallback_color: "#00f0ff"
      },
      {
        id: 2,
        title: "Smarter Solutions",
        description: "Empowering modern enterprise architecture and strategic operations.",
        src: `${SUPABASE_URL}/storage/v1/object/public/gallery-assets/Smarter%20solutions_stronger%20Business.jpeg`,
        fallback_color: "#b026ff"
      },
      {
        id: 3,
        title: "AI Brand Vibe",
        description: "Revolutionizing brand pipelines with futuristic neural aesthetics.",
        src: `${SUPABASE_URL}/storage/v1/object/public/gallery-assets/AIBrandvibe.jpeg`,
        fallback_color: "#ff0055"
      },
      {
        id: 4,
        title: "Real Estate Showcases",
        description: "High-fidelity architectural rendering and interactive spatial designs.",
        src: `${SUPABASE_URL}/storage/v1/object/public/gallery-assets/realestate.jpeg`,
        fallback_color: "#39ff14"
      },
      {
        id: 5,
        title: "Limitless Innovation",
        description: "Next-gen animation, CGI capabilities, and cinematic VFX development.",
        src: `${SUPABASE_URL}/storage/v1/object/public/gallery-assets/limitless.jpeg`,
        fallback_color: "#ffaa00"
      }
    ];

    const results = [];

    // Update each asset
    for (const asset of newAssets) {
      const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/gallery_assets?id=eq.${asset.id}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${serviceRoleKey}`,
          "apikey": serviceRoleKey,
          "Content-Type": "application/json",
          "Prefer": "return=representation"
        },
        body: JSON.stringify({
          title: asset.title,
          description: asset.description,
          src: asset.src,
          fallback_color: asset.fallback_color
        })
      });

      if (!updateRes.ok) {
        throw new Error(`Failed to update asset ID ${asset.id}: ${await updateRes.text()}`);
      }

      const updatedData = await updateRes.json();
      results.push({ id: asset.id, status: "updated", data: updatedData });
    }

    // Delete asset ID 6
    const deleteRes = await fetch(`${SUPABASE_URL}/rest/v1/gallery_assets?id=eq.6`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${serviceRoleKey}`,
        "apikey": serviceRoleKey
      }
    });

    if (deleteRes.ok) {
      results.push({ id: 6, status: "deleted" });
    } else {
      results.push({ id: 6, status: "delete_failed", details: await deleteRes.text() });
    }

    return res.status(200).json({ success: true, results });
  } catch (err) {
    console.error("Update Gallery Assets Error:", err);
    return res.status(500).json({ error: { message: err.message || "Internal Server Error" } });
  }
};

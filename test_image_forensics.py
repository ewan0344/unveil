from backend.analyzers.image_analyzer import analyze_image

print("=== 1. Testing Synthetic AI Image ===")
r1 = analyze_image("backend/sample_cases/ai_portrait.jpg", "ai_portrait.jpg")
print(f"Verdict: {r1['verdict']} | Strength: {r1['evidence_strength']} | Score: {r1['heuristic_score']}")
print("Exposed Measurements:")
for m in r1["measurements"]:
    print(f"  [{m['anomaly']}] {m['domain']}: {m['observation']}")
print("Why reached:", r1["reasoning"])

print("\n=== 2. Testing Authentic Camera Photo ===")
r2 = analyze_image("backend/sample_cases/camera_photo.jpg", "camera_photo.jpg")
print(f"Verdict: {r2['verdict']} | Strength: {r2['evidence_strength']} | Score: {r2['heuristic_score']}")
print("Exposed Measurements:")
for m in r2["measurements"]:
    print(f"  [{m['anomaly']}] {m['domain']}: {m['observation']}")

print("\n=== 3. Testing Photographic Reference ===")
r3 = analyze_image("frontend/public/assets/hero_reference.jpg", "hero_reference.jpg")
print(f"Verdict: {r3['verdict']} | Strength: {r3['evidence_strength']} | Score: {r3['heuristic_score']}")
print("Exposed Measurements:")
for m in r3["measurements"]:
    print(f"  [{m['anomaly']}] {m['domain']}: {m['observation']}")

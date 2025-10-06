import base64
import io
import json
import math
import struct
import wave
import zlib
from pathlib import Path

# Define combos with (result, ingredient1, ingredient2, age)
COMBOS = [
    ("Steam", "Fire", "Water", "Primal"),
    ("Lava", "Fire", "Earth", "Primal"),
    ("Smoke", "Fire", "Air", "Primal"),
    ("Mud", "Water", "Earth", "Primal"),
    ("Mist", "Water", "Air", "Primal"),
    ("Dust", "Earth", "Air", "Primal"),
    ("Plasma", "Fire", "Fire", "Primal"),
    ("Lake", "Water", "Water", "Primal"),
    ("Stone", "Earth", "Earth", "Primal"),
    ("Pressure", "Air", "Air", "Primal"),
    ("Metal", "Stone", "Fire", "Primal"),
    ("Crystal", "Pressure", "Water", "Primal"),
    ("Volcano", "Lava", "Earth", "Primal"),
    ("Geyser", "Steam", "Earth", "Primal"),
    ("Sand", "Stone", "Air", "Primal"),
    ("Swamp", "Mud", "Mist", "Primal"),
    ("Life", "Energy", "Swamp", "Primal"),
    ("Energy", "Plasma", "Air", "Primal"),
    ("Obsidian", "Lava", "Water", "Primal"),
    ("Ash", "Smoke", "Earth", "Primal"),
    ("Seed", "Life", "Earth", "Natural"),
    ("Tree", "Seed", "Water", "Natural"),
    ("Moss", "Life", "Stone", "Natural"),
    ("Fungus", "Life", "Swamp", "Natural"),
    ("Beast", "Life", "Tree", "Natural"),
    ("Bird", "Life", "Air", "Natural"),
    ("Fish", "Life", "Water", "Natural"),
    ("Reptile", "Life", "Lava", "Natural"),
    ("Herb", "Seed", "Mist", "Natural"),
    ("Flower", "Tree", "Energy", "Natural"),
    ("Forest", "Tree", "Tree", "Natural"),
    ("Bees", "Flower", "Air", "Natural"),
    ("Honey", "Bees", "Flower", "Natural"),
    ("Wolf", "Beast", "Forest", "Natural"),
    ("Human", "Life", "Energy", "Natural"),
    ("Tool", "Stone", "Human", "Civilization"),
    ("House", "Tree", "Tool", "Civilization"),
    ("Farm", "Human", "Herb", "Civilization"),
    ("Bread", "Farm", "Fire", "Civilization"),
    ("Cloth", "Tool", "Fungus", "Civilization"),
    ("Boat", "Wood", "Water", "Civilization"),
    ("Wood", "Tree", "Tool", "Civilization"),
    ("Wheel", "Tool", "Stone", "Civilization"),
    ("Cart", "Wheel", "Wood", "Civilization"),
    ("Road", "Stone", "Cart", "Civilization"),
    ("Market", "Road", "Human", "Civilization"),
    ("Currency", "Market", "Metal", "Civilization"),
    ("Writing", "Human", "Tool", "Civilization"),
    ("Library", "Writing", "House", "Civilization"),
    ("School", "Library", "Human", "Civilization"),
    ("Philosophy", "Human", "Energy", "Civilization"),
    ("Medicine", "Human", "Herb", "Civilization"),
    ("Music", "Human", "Bird", "Civilization"),
    ("Painting", "Human", "Flower", "Civilization"),
    ("Statue", "Tool", "Stone", "Civilization"),
    ("Castle", "Stone", "House", "Civilization"),
    ("Sail", "Cloth", "Wind", "Civilization"),
    ("Wind", "Air", "Energy", "Natural"),
    ("Navigation", "Boat", "Star", "Civilization"),
    ("Star", "Energy", "Air", "Primal"),
    ("Compass", "Navigation", "Metal", "Civilization"),
    ("Paper", "Wood", "Water", "Civilization"),
    ("Ink", "Water", "Ash", "Civilization"),
    ("Book", "Paper", "Ink", "Civilization"),
    ("PrintingPress", "Book", "Metal", "Industrial"),
    ("Coal", "Swamp", "Pressure", "Industrial"),
    ("SteamEngine", "Steam", "Metal", "Industrial"),
    ("Train", "SteamEngine", "Cart", "Industrial"),
    ("Factory", "SteamEngine", "House", "Industrial"),
    ("Electricity", "Energy", "Metal", "Industrial"),
    ("Battery", "Electricity", "Metal", "Industrial"),
    ("Lightbulb", "Electricity", "Glass", "Industrial"),
    ("Glass", "Sand", "Fire", "Industrial"),
    ("Concrete", "Stone", "Sand", "Industrial"),
    ("Oil", "Pressure", "Swamp", "Industrial"),
    ("Plastic", "Oil", "Energy", "Industrial"),
    ("Chemical", "Oil", "Water", "Industrial"),
    ("Radio", "Electricity", "Air", "Modern"),
    ("Television", "Radio", "Lightbulb", "Modern"),
    ("Computer", "Electricity", "Logic", "Modern"),
    ("Logic", "Philosophy", "Tool", "Civilization"),
    ("Circuit", "Metal", "Plastic", "Modern"),
    ("Robot", "Computer", "Metal", "Futuristic"),
    ("Drone", "Robot", "Air", "Futuristic"),
    ("Satellite", "Rocket", "Radio", "Futuristic"),
    ("Rocket", "Fuel", "Metal", "Modern"),
    ("Fuel", "Oil", "Fire", "Industrial"),
    ("Astronaut", "Human", "Rocket", "Modern"),
    ("SpaceStation", "Satellite", "House", "Futuristic"),
    ("AI", "Computer", "Logic", "Futuristic"),
    ("Nanotech", "AI", "Chemical", "Futuristic"),
    ("Fusion", "Plasma", "Metal", "Futuristic"),
    ("Hovercar", "Nanotech", "Vehicle", "Futuristic"),
    ("Vehicle", "Engine", "Cart", "Industrial"),
    ("Engine", "Fuel", "Metal", "Industrial"),
    ("City", "House", "Road", "Civilization"),
    ("Suburb", "City", "Garden", "Modern"),
    ("Garden", "Tree", "Flower", "Natural"),
    ("Skyscraper", "City", "Concrete", "Modern"),
    ("Internet", "Computer", "Radio", "Modern"),
    ("Smartphone", "Computer", "Television", "Modern"),
    ("App", "Smartphone", "Logic", "Modern"),
    ("Cloud", "Internet", "Mist", "Modern"),
    ("Server", "Computer", "Metal", "Modern"),
    ("DroneDelivery", "Drone", "Market", "Futuristic"),
    ("Biotech", "Medicine", "Nanotech", "Futuristic"),
    ("Terraformer", "Nanotech", "Earth", "Futuristic"),
    ("TimeCrystal", "Fusion", "Crystal", "Futuristic"),
    ("QuantumComputer", "AI", "Crystal", "Futuristic"),
    ("Hologram", "Lightbulb", "AI", "Futuristic"),
    ("Antigravity", "Fusion", "Wind", "Futuristic"),
    ("ForceField", "Antigravity", "Crystal", "Futuristic"),
    ("Singularity", "AI", "Fusion", "Futuristic"),
    ("EnergyGrid", "Electricity", "City", "Modern"),
    ("SolarPanel", "Sun", "Metal", "Modern"),
    ("Sun", "Star", "Fire", "Natural"),
    ("WindTurbine", "Wind", "Metal", "Modern"),
    ("HydroPlant", "Water", "Electricity", "Modern"),
    ("Dam", "River", "Concrete", "Industrial"),
    ("River", "Lake", "Pressure", "Natural"),
    ("Bridge", "Stone", "River", "Civilization"),
    ("Aqueduct", "Bridge", "Water", "Civilization"),
    ("Irrigation", "Aqueduct", "Farm", "Civilization"),
    ("MedicineHerb", "Herb", "Knowledge", "Civilization"),
    ("Knowledge", "School", "Book", "Civilization"),
    ("University", "School", "Philosophy", "Civilization"),
    ("Engineer", "University", "Tool", "Industrial"),
    ("Scientist", "University", "Energy", "Industrial"),
    ("Lab", "Scientist", "Chemical", "Industrial"),
    ("Research", "Lab", "Knowledge", "Modern"),
    ("Antibiotic", "Lab", "Medicine", "Modern"),
    ("Vaccine", "Lab", "Virus", "Modern"),
    ("Virus", "Life", "Swamp", "Natural"),
    ("Hospital", "Medicine", "House", "Modern"),
    ("PowerPlant", "EnergyGrid", "Fuel", "Modern"),
    ("Recycling", "City", "Plastic", "Modern"),
    ("Biodome", "Terraformer", "Forest", "Futuristic"),
    ("Mech", "Robot", "Engine", "Futuristic"),
    ("NeuralLink", "AI", "Human", "Futuristic"),
    ("Colony", "SpaceStation", "Terraformer", "Futuristic"),
    ("ChronoLab", "TimeCrystal", "Lab", "Futuristic"),
    ("StasisPod", "ChronoLab", "Hospital", "Futuristic"),
    ("DimensionalGate", "Singularity", "ForceField", "Futuristic"),
    ("Arcology", "Skyscraper", "Biodome", "Futuristic"),
    ("EcoCity", "Arcology", "Recycling", "Futuristic"),
    ("Starship", "Fusion", "Rocket", "Futuristic"),
    ("GalacticMap", "Starship", "Navigation", "Futuristic"),
    ("Chronicle", "Book", "TimeCrystal", "Futuristic"),
    ("Myth", "Chronicle", "Philosophy", "Futuristic"),
    ("Legacy", "Chronicle", "Knowledge", "Futuristic"),
    ("CosmicGarden", "Biodome", "Star", "Futuristic"),
    ("ElementalCore", "Fusion", "Crystal", "Futuristic"),
    ("Hypernet", "Internet", "QuantumComputer", "Futuristic"),
    ("GenesisSeed", "Life", "ElementalCore", "Futuristic"),
    ("SingularityEngine", "Singularity", "Engine", "Futuristic"),
    ("ChronoCompass", "Compass", "ChronoLab", "Futuristic"),
    ("LuminousInk", "Ink", "Lightbulb", "Modern"),
    ("NeonDye", "Chemical", "Lightbulb", "Modern"),
    ("Festival", "Music", "City", "Civilization"),
    ("Opera", "Music", "House", "Civilization"),
    ("Cuisine", "Fire", "Farm", "Civilization"),
    ("Spice", "Herb", "Fire", "Natural"),
    ("Tea", "Water", "Herb", "Natural"),
    ("Ceremony", "Tea", "Philosophy", "Civilization"),
    ("Guild", "Market", "Knowledge", "Civilization"),
    ("Bank", "Currency", "House", "Civilization"),
    ("Law", "Philosophy", "City", "Civilization"),
    ("Democracy", "Law", "Human", "Civilization"),
    ("Code", "Law", "Writing", "Civilization"),
    ("Constitution", "Democracy", "Code", "Civilization"),
    ("Parliament", "Democracy", "House", "Civilization"),
    ("Observation", "Star", "Tool", "Civilization"),
    ("Telescope", "Observation", "Glass", "Civilization"),
    ("Observatory", "Telescope", "House", "Civilization"),
    ("Calendar", "Sun", "Writing", "Civilization"),
    ("FestivalLights", "Festival", "Lightbulb", "Modern"),
]

# Validate uniqueness
unique_results = {r for r, _, _, _ in COMBOS}
if len(unique_results) != len(COMBOS):
    raise ValueError("Duplicate results detected")

BASE_ELEMENTS = ["Fire", "Water", "Earth", "Air"]

all_elements = sorted(set(BASE_ELEMENTS) | unique_results | {i for _, i, _, _ in COMBOS} | {j for _, _, j, _ in COMBOS})

# create icons directory
icons_dir = Path("src/assets/icons")
icons_dir.mkdir(parents=True, exist_ok=True)

# simple color palette
colors = [
    "#ff5f6d",
    "#ffc371",
    "#47cacc",
    "#845ec2",
    "#ff9671",
    "#00c9a7",
    "#f9f871",
    "#00b4d8",
    "#ff6f91",
    "#f6d743",
]

def color_for(name: str) -> str:
    return colors[hash(name) % len(colors)]

svg_template = """<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128'>\n  <defs>\n    <radialGradient id='grad' cx='50%' cy='50%' r='70%'>\n      <stop offset='0%' stop-color='{color}' stop-opacity='0.95'/>\n      <stop offset='100%' stop-color='#040014' stop-opacity='1'/>\n    </radialGradient>\n  </defs>\n  <rect x='4' y='4' width='120' height='120' rx='26' fill='url(#grad)' stroke='{color}' stroke-width='6'/>\n  <text x='50%' y='54%' dominant-baseline='middle' text-anchor='middle' font-family='Verdana' font-size='32' fill='#ffffff'>{abbr}</text>\n  <text x='50%' y='84%' dominant-baseline='middle' text-anchor='middle' font-family='Verdana' font-size='14' fill='#b2f7ef'>{name}</text>\n</svg>\n"""

for element in all_elements:
    abbr = ''.join([word[0] for word in element.split() if word]).upper()[:3]
    if not abbr:
        abbr = element[:3].upper()
    svg = svg_template.format(color=color_for(element), abbr=abbr, name=element[:12])
    with open(icons_dir / f"{element.replace(' ', '_')}.svg", "w", encoding="utf-8") as f:
        f.write(svg)

sounds_dir = Path("src/assets/sounds")
sounds_dir.mkdir(parents=True, exist_ok=True)

# simple sine wave generator for sounds
def write_module(path: Path, mime: str, payload: bytes):
    base64_data = base64.b64encode(payload).decode('ascii')
    prefix = f"data:{mime};base64,"
    chunk_size = 96
    chunks = [base64_data[i : i + chunk_size] for i in range(0, len(base64_data), chunk_size)]
    lines = ["const data = [", f"  '{prefix}'"]
    for index, chunk in enumerate(chunks):
        suffix = ',' if index < len(chunks) - 1 else ''
        lines.append(f"  '{chunk}'{suffix}")
    lines.append("].join('');")
    lines.append("")
    lines.append("export default data;")
    path.write_text('\n'.join(lines) + '\n', encoding='utf-8')


def create_tone(stem: str, frequency: float, duration: float, volume: float = 0.5):
    sample_rate = 44100
    n_samples = int(sample_rate * duration)
    buffer = io.BytesIO()
    with wave.open(buffer, 'w') as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        for i in range(n_samples):
            t = i / sample_rate
            value = int(volume * 32767 * math.sin(2 * math.pi * frequency * t))
            wav_file.writeframes(struct.pack('<h', value))
    write_module(sounds_dir / f"{stem}.js", 'audio/wav', buffer.getvalue())


create_tone('discover', 880.0, 0.35)
create_tone('fail', 140.0, 0.3, volume=0.6)
create_tone('levelup', 523.25, 0.6, volume=0.5)

particles_dir = Path("src/assets/particles")
particles_dir.mkdir(parents=True, exist_ok=True)

# Create particle sprite using raw PNG encoding
def write_png(path: Path, size: int = 64):
    width = height = size
    raw = bytearray()
    radius = size / 2
    for y in range(height):
        raw.append(0)  # filter type 0
        for x in range(width):
            dx = x + 0.5 - radius
            dy = y + 0.5 - radius
            dist = math.sqrt(dx * dx + dy * dy)
            if dist > radius:
                alpha = 0
            else:
                alpha = max(0, min(255, int(255 * (1 - dist / radius))))
            raw.extend((255, 255, 255, alpha))
    def chunk(chunk_type: bytes, data: bytes) -> bytes:
        return struct.pack('>I', len(data)) + chunk_type + data + struct.pack('>I', zlib.crc32(chunk_type + data) & 0xffffffff)
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    idat = zlib.compress(bytes(raw), level=9)
    png_bytes = b"\x89PNG\r\n\x1a\n" + chunk(b'IHDR', ihdr) + chunk(b'IDAT', idat) + chunk(b'IEND', b'')
    write_module(path, 'image/png', png_bytes)


write_png(particles_dir / 'spark.js')

# Write combos file
utils_dir = Path("src/utils")
utils_dir.mkdir(parents=True, exist_ok=True)

combos_export = []
for result, a, b, age in COMBOS:
    combos_export.append({
        "result": result,
        "ingredients": [a, b],
        "age": age,
    })

with open(utils_dir / 'Combos.js', 'w', encoding='utf-8') as f:
    f.write("export const BASE_ELEMENTS = [\n")
    for base in BASE_ELEMENTS:
        f.write(f"  '{base}',\n")
    f.write("];\n\n")
    f.write("export const COMBOS = [\n")
    for combo in combos_export:
        ingredients = ", ".join([f"'{item}'" for item in combo["ingredients"]])
        f.write(
            f"  {{ result: '{combo['result']}', ingredients: [{ingredients}], age: '{combo['age']}' }},\n"
        )
    f.write("] as const;\n\n")
    f.write("export const AGES = ['Primal', 'Natural', 'Civilization', 'Industrial', 'Modern', 'Futuristic'] as const;\n")

manifest = {
    "elements": sorted(all_elements),
    "count": len(all_elements),
}
with open(icons_dir / 'manifest.json', 'w', encoding='utf-8') as f:
    json.dump(manifest, f, indent=2)

print(f"Generated {len(all_elements)} element icons and {len(COMBOS)} combos")

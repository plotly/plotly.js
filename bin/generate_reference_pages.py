import os
from pathlib import Path

def generate_pages(path, output_dir, parent):
    with os.scandir(path) as it:
        for folder in it:
            dir_name = folder.name + ".md"
            # print(dir_name)
            # Make md file storing its snippet
            file_path = os.path.join(output_dir, dir_name)

            with open(file_path, 'w') as f:
                f.write(f'# {folder.name}\n')
                f.write(f'--8<-- \"{parent}/{folder.name}/index.html\"\n')

    it.close()

# Walk through the docs/tmp/ directory and generate .md files that include the html snippets in it
parent = Path(__file__).resolve().parents[1]
ref_path = f"{parent}/docs/tmp/reference" 
ref_output_dir = f"{parent}/pages/reference/"

examples_path = f"{parent}/docs/tmp/javascript" 
examples_output_dir = f"{parent}/pages/examples/"

# Make directories if it doesn't exist
os.makedirs(ref_output_dir, exist_ok=True)
os.makedirs(examples_output_dir, exist_ok=True)

generate_pages(ref_path, ref_output_dir, "reference")
generate_pages(examples_path, examples_output_dir, "javascript")


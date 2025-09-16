import os
from pathlib import Path
import mkdocs_gen_files

def generate_pages(path, output_dir, parent, nav=None):
    """
    Walks through the path and generates markdown files that 
    include the corresponding html snippets in it.
    """
    with os.scandir(path) as it:
        entries = sorted(it, key= lambda e: e.name)
        for folder in entries:
            dir_name = folder.name + ".md"
            file_path = os.path.join(output_dir, dir_name)

            with open(file_path, 'w') as f:
                f.write(f'# {folder.name}\n')
                f.write(f'--8<-- \"{parent}/{folder.name}/index.html\"\n')

            # Add markdown file to navigation
            if nav is not None:
                nav[(folder.name)] = dir_name

    it.close()

nav = mkdocs_gen_files.Nav()

parent = Path(__file__).resolve().parents[1]
ref_path = f"{parent}/docs/tmp/reference" 
ref_output_dir = f"{parent}/pages/reference/"

examples_path = f"{parent}/docs/tmp/javascript" 
examples_output_dir = f"{parent}/pages/examples/"

# Make directories if it doesn't exist
os.makedirs(ref_output_dir, exist_ok=True)
os.makedirs(examples_output_dir, exist_ok=True)

generate_pages(ref_path, ref_output_dir, "reference", nav)
generate_pages(examples_path, examples_output_dir, "javascript")

with mkdocs_gen_files.open("reference/SUMMARY.md", "w") as nav_file:  
    nav_file.writelines(nav.build_literate_nav())  
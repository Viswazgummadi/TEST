#
# This is the NEW, SOTA version of backend/app/code_parser/python_parser.py
#
import ast
from flask import current_app

class CodeAnalyzer(ast.NodeVisitor):
    """
    An advanced AST visitor to extract detailed information from Python code,
    including classes, functions, methods, imports, and function calls.
    """
    def __init__(self, source_code: str):
        self.source_code = source_code
        self.imports = []
        self.classes = {}
        self.functions = []
        self.current_class = None

    def visit_Import(self, node: ast.Import):
        for alias in node.names:
            self.imports.append({"module": alias.name, "asname": alias.asname})
        self.generic_visit(node)

    def visit_ImportFrom(self, node: ast.ImportFrom):
        for alias in node.names:
            self.imports.append({"module": node.module, "name": alias.name, "asname": alias.asname})
        self.generic_visit(node)

    def visit_ClassDef(self, node: ast.ClassDef):
        self.current_class = node.name
        self.classes[node.name] = {
            "name": node.name,
            "methods": [],
            "docstring": ast.get_docstring(node) or "",
            "base_classes": [base.id for base in node.bases if isinstance(base, ast.Name)]
        }
        self.generic_visit(node)
        self.current_class = None

    def visit_FunctionDef(self, node: ast.FunctionDef):
        function_info = {
            "name": node.name,
            "args": [arg.arg for arg in node.args.args],
            "docstring": ast.get_docstring(node) or "",
            "source_code": self._get_source_segment(node),
            "calls": self._find_calls(node)
        }
        
        if self.current_class:
            # This is a method within a class
            self.classes[self.current_class]["methods"].append(function_info)
        else:
            # This is a standalone function
            self.functions.append(function_info)
            
        # We don't call generic_visit here to avoid visiting nested functions twice
        # The _find_calls method already traverses the function's body.

    def _find_calls(self, node: ast.FunctionDef) -> list[str]:
        """Find all function calls within a given function definition node."""
        calls = []
        for sub_node in ast.walk(node):
            if isinstance(sub_node, ast.Call):
                if isinstance(sub_node.func, ast.Name):
                    calls.append(sub_node.func.id)
                elif isinstance(sub_node.func, ast.Attribute):
                    # This captures method calls like `self.connect()` or `socket.socket()`
                    # We can refine this further later if needed
                    calls.append(sub_node.func.attr)
        return list(set(calls)) # Return unique calls

    def _get_source_segment(self, node) -> str:
        """Safely get the source code segment for a node."""
        try:
            return ast.get_source_segment(self.source_code, node)
        except Exception:
            return f"# Could not extract source code for {getattr(node, 'name', 'node')}."

    def analyze(self) -> dict:
        """Run the analysis and return the structured data."""
        self.visit(ast.parse(self.source_code))
        return {
            "imports": self.imports,
            "classes": list(self.classes.values()),
            "functions": self.functions
        }

def parse_python_file(file_content: str) -> dict | None:
    """

    Parses the content of a Python file using the advanced CodeAnalyzer.
    
    Returns a rich dictionary containing imports, classes (with their methods),
    standalone functions, and the calls made within each function/method.
    """
    try:
        # We use the CodeAnalyzer class to perform the deep analysis
        analyzer = CodeAnalyzer(file_content)
        return analyzer.analyze()
    except SyntaxError as e:
        current_app.logger.warning(f"Could not parse Python file due to SyntaxError: {e}")
        return None
    except Exception as e:
        current_app.logger.error(f"An unexpected error occurred during parsing: {e}", exc_info=True)
        return None
import ast
import math
import operator as op
from datetime import datetime

SAFE_OPS = {
    ast.Add: op.add, ast.Sub: op.sub, ast.Mult: op.mul,
    ast.Div: op.truediv, ast.Pow: op.pow, ast.USub: op.neg,
    ast.Mod: op.mod, ast.FloorDiv: op.floordiv,
}
SAFE_NAMES = {"pi": math.pi, "e": math.e}
SAFE_FUNCS = {
    "sqrt": math.sqrt, "abs": abs, "round": round,
    "sin": math.sin, "cos": math.cos, "tan": math.tan,
    "log": math.log, "log10": math.log10,
    "floor": math.floor, "ceil": math.ceil,
}


def _eval_node(node):
    if isinstance(node, ast.Constant):
        return node.value
    if isinstance(node, ast.Name) and node.id in SAFE_NAMES:
        return SAFE_NAMES[node.id]
    if isinstance(node, ast.BinOp) and type(node.op) in SAFE_OPS:
        return SAFE_OPS[type(node.op)](_eval_node(node.left), _eval_node(node.right))
    if isinstance(node, ast.UnaryOp) and type(node.op) in SAFE_OPS:
        return SAFE_OPS[type(node.op)](_eval_node(node.operand))
    if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id in SAFE_FUNCS:
        return SAFE_FUNCS[node.func.id](*[_eval_node(a) for a in node.args])
    raise ValueError("Unsafe or unsupported expression")


def _calculate(expression: str) -> str:
    try:
        tree = ast.parse(expression.strip(), mode="eval")
        result = _eval_node(tree.body)
        if isinstance(result, float) and result.is_integer():
            result = int(result)
        return str(result)
    except Exception as e:
        return f"Error: {e}"


def execute_tool(name: str, args: dict) -> str:
    if name == "calculate":
        return _calculate(args.get("expression", ""))
    if name == "get_current_datetime":
        return datetime.now().strftime("%A, %B %d %Y — %I:%M %p")
    return "Unknown tool"


TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "calculate",
            "description": "Evaluate a mathematical expression. Use for any arithmetic, algebra, or math calculation.",
            "parameters": {
                "type": "object",
                "properties": {
                    "expression": {
                        "type": "string",
                        "description": "Math expression to evaluate, e.g. '2 + 2', 'sqrt(144)', '15 * 8 / 3'"
                    }
                },
                "required": ["expression"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_current_datetime",
            "description": "Get the current date and time. Use when the user asks about today's date, day of the week, or current time.",
            "parameters": {
                "type": "object",
                "properties": {}
            }
        }
    },
]

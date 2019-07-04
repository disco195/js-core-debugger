import {Node, Parser} from "acorn";
import {
    AssignmentExpression,
    BlockStatement, ExpressionStatement,
    Function,
    FunctionDeclaration,
    Identifier,
    Pattern,
    Program, ReturnStatement,
    SourceLocation,
    VariableDeclaration,
    VariableDeclarator
} from "estree";
import {CodeGenTemplates, CodeNode} from "./templates";

type N<T> = Node & T;

export class CoreDebugger {
    public _input: string[];

    codeGenerate(input: string) {
        this._input = input.split('\n');
        const parser = new Parser({ locations: true }, input);
        const astTree = parser.parse() as unknown as Program;

        this.processProgram(astTree);
    }

    processProgram(programNode: Program) {
        programNode.body.forEach(funcNode => {
            if (funcNode.type === "FunctionDeclaration") {
                this.processFuncNode(funcNode as N<FunctionDeclaration>);
            }
        })
    }

    processFuncNode(funcNode: (N<FunctionDeclaration>)) {
        funcNode.params.forEach(paramNode => {
            if (paramNode.type === "Identifier") {
                this._insertCode(CodeGenTemplates.identifier(paramNode as N<Identifier>));
            }
        });

        this.processBlockStatementNode(funcNode.body as N<BlockStatement>);
    }

    processBlockStatementNode(blockNode: N<BlockStatement>) {
        blockNode.body.forEach(node => {
            switch (node.type) {
                case "VariableDeclaration":
                    this.processVariableDeclarationNode(node as N<VariableDeclaration>);
                    break;
                case "ExpressionStatement":
                    this.processExpressionStatement(node as N<ExpressionStatement>);
                    break;
                case "ReturnStatement":
                    this.processReturnStatement(node as N<ReturnStatement>);
                    break;
            }
        })
    }

    processExpressionStatement(exp: N<ExpressionStatement>) {
        switch (exp.expression.type) {
            case "AssignmentExpression":
                this._insertCode(CodeGenTemplates.identifier(exp.expression.left as N<Identifier>));
                break;
        }
    }

    private processReturnStatement(ret: N<ReturnStatement>) {
        switch (ret.argument.type) {
            case "Identifier":
                this._insertCode(CodeGenTemplates.identifier(ret.argument as N<Identifier>));
                break;
        }
    }

    processVariableDeclarationNode(variableNode: (N<VariableDeclaration>)) {
        variableNode.declarations.forEach(varDecl => {
            this._insertCode(CodeGenTemplates.varDeclNode(varDecl as N<VariableDeclarator>))
        });
    }

    private _insertCode(codeNode: CodeNode) {
        this._input[codeNode.line - 1] += codeNode.code;
    }
}

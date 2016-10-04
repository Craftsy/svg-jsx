var esprima = require('esprima-fb');
var recast = require('recast');
var builders = recast.types.builders;

module.exports = function(svgString, {customProperties}) {
    var ast = recast.parse(svgString, {parser: esprima}).program;

    recast.types.visit(
        ast,
        {
            visitJSXAttribute: function(path) {
                // don't retain width and height
                var attributeName = path.value.name.name;

                if (attributeName === 'width' || attributeName === 'height' || attributeName === 'xmlns') {
                    path.prune();
                    return false;
                }

                this.traverse(path);
            },

            visitJSXIdentifier: function(path) {
                convertClassIdentifier(path);
                this.traverse(path);
            },

            visitJSXOpeningElement: function(path) {
                var jsxNodeName = path.value.name.name;

                if (jsxNodeName === 'svg') {
                    addCustomProperties(path, customProperties);
                }

                this.traverse(path);
            }
        }
    );

    ast = importReactStatement(
        makeLastStatementExport(
            wrapAstInFunction(
                'SvgIcon',
                makeLastStatementReturn(ast)
            )
        )
    );

    return recast.print(ast, {parser: esprima}).code;
};

function addCustomProperties(path, customProperties) {
    path.value.attributes = path.value.attributes || [];

    (customProperties || []).forEach(propertyName => {
        path.value.attributes.push(
            builders.jsxAttribute(
                builders.jsxIdentifier(propertyName),
                builders.jsxExpressionContainer(
                    builders.memberExpression(
                        builders.identifier('props'),
                        builders.literal(propertyName),
                        true
                    )
                )
            )
        );
    });
}

function stripSvgArguments(svgString) {
    var viewBox = (svgString.match(/viewBox=['"]([^'"]*)['"]/) || [])[1];
    var viewBoxStr = '';
    if (viewBox) viewBoxStr = 'viewBox="'+viewBox+'"';

    return svgString
    // remove and parameterize all svg attributes except viewbox
        .replace(/<svg([^>]*)*>/, '<svg {...params}'+viewBoxStr+'>');
}

function convertClassIdentifier(node) {
    node.value.name = node.value.name.replace(/^class$/, 'className');
}

function makeLastStatementReturn(ast) {
    var idx = ast.body.length-1;
    var lastStatement = ast.body[idx];

    if (lastStatement && lastStatement.type !== 'ReturnStatement') {
        ast.body[idx] = {
            'type': 'ReturnStatement',
            'argument': lastStatement
        };
    }

    return ast;
}

function makeLastStatementExport(ast) {
    var idx = ast.body.length-1;
    var lastStatement = ast.body[idx];

    ast.body[idx] = {
        'type': 'ExportDefaultDeclaration',
        'declaration': lastStatement
    };

    return ast;
}

function importReactStatement(ast) {
    ast.body.unshift({
        type: 'ImportDeclaration',
        source: {
            raw: '\'react\'',
            type: 'Literal',
            value: 'react'
        },
        specifiers: [{
            type: 'ImportDefaultSpecifier',
            local: {
                type: 'Identifier',
                name: 'React'
            }
        }]
    });
    return ast;
}

function wrapAstInFunction(functionName, ast) {
    var wrappedAst = {
        type: 'FunctionDeclaration',
        defaults: [],
        expression: false,
        generator: false,
        id: {
            name: functionName,
            type: 'Identifier'
        },
        params: [{name: 'props', type: 'Identifier'}],
        body: {
            type: 'BlockStatement',
            body: ast.body
        }
    };

    ast.body = [wrappedAst];

    return ast;
}

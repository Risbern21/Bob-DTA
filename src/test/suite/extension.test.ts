import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
  
  vscode.window.showInformationMessage('Start all tests.');

  test('Extension should be present', () => {
    assert.ok(vscode.extensions.getExtension('bob-dta.bob-dta'));
  });

  test('Should register watsonx.login command', async () => {
    const extension = vscode.extensions.getExtension('bob-dta.bob-dta');
    if (extension && !extension.isActive) {
      await extension.activate();
    }
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('watsonx.login'), 'watsonx.login command should be registered');
  });

  test('Should register watsonx.logout command', async () => {
    const extension = vscode.extensions.getExtension('bob-dta.bob-dta');
    if (extension && !extension.isActive) {
      await extension.activate();
    }
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('watsonx.logout'), 'watsonx.logout command should be registered');
  });

  test('Should register watsonx.generateDocs command', async () => {
    const extension = vscode.extensions.getExtension('bob-dta.bob-dta');
    if (extension && !extension.isActive) {
      await extension.activate();
    }
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('watsonx.generateDocs'));
  });

  test('Should have correct display name', () => {
    const extension = vscode.extensions.getExtension('bob-dta.bob-dta');
    if (extension) {
      assert.strictEqual(extension.packageJSON.displayName, 'Bob-DTA');
    }
  });

  test('Should have correct description', () => {
    const extension = vscode.extensions.getExtension('bob-dta.bob-dta');
    if (extension) {
      assert.ok(extension.packageJSON.description);
      assert.ok(extension.packageJSON.description.includes('documentation'));
    }
  });

  test('Should have watsonx configuration', () => {
    const config = vscode.workspace.getConfiguration('watsonx');
    assert.ok(config);
  });

  test('Should have projectId configuration', () => {
    const config = vscode.workspace.getConfiguration('watsonx');
    assert.ok(config.has('projectId'));
  });

  test('Should have region configuration', () => {
    const config = vscode.workspace.getConfiguration('watsonx');
    assert.ok(config.has('region'));
  });

  test('Should have model configuration', () => {
    const config = vscode.workspace.getConfiguration('watsonx');
    assert.ok(config.has('model'));
  });

  test('Should have default region as us-south', () => {
    const config = vscode.workspace.getConfiguration('watsonx');
    const defaultRegion = config.inspect('region')?.defaultValue;
    assert.strictEqual(defaultRegion, 'us-south');
  });

  test('Should have default model as granite', () => {
    const config = vscode.workspace.getConfiguration('watsonx');
    const defaultModel = config.inspect('model')?.defaultValue;
    assert.strictEqual(defaultModel, 'ibm/granite-8b-code-instruct');
  });
});

// Made with Bob

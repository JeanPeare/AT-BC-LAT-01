import { Scenario } from './Scenario.js';


const testScenario = new Scenario (1);

test('The Scenario need to be created correctly with its id', () => {
    expect(new Scenario(1)).toEqual({'id': 1});
});

test('The actors need to be parsed as new classes correctly into an array', () => {
    var actorObjects = [
        {name: 'Marco',
            type: 'PF Squad Soldier',
            weapon: 'Handgun'},
        {name: 'RAS1',
            type: 'Rebel Army soldier',
            weapon: 'rifle'},
        {name: 'RAT1',
            type: 'Rebel Army Tank',
            weapon: 'tank cannon'}];
    expect(testScenario.createActor(actorObjects)).toEqual([
        {'health': 2, 'name': 'Marco', 'type': 'PF Squad Soldier', 'weapon': 'Handgun'},
        {'health': 2, 'name': 'RAS1', 'type': 'Rebel Army soldier', 'weapon': 'rifle'},
        {'health': 2, 'name': 'RAT1', 'type': 'Rebel Army Tank', 'weapon': 'tank cannon'}]);
});

test('Actions need to be parsedas new classes correctly into an array', () => {
    var actionObjects = [
        {actor: 'Marco',
            action: 'Pick Weapon',
            element: 'Shotgun'},
        {actor: 'Marco',
            action: 'Shoot Weapon',
            element: 'Shotgun'},
        {actor: 'RAT1',
            action: 'Receive Attack',
            from: 'Marco'}];
    expect(new Scenario(1)).toEqual({'id': 1});
    expect(testScenario.createActions(actionObjects)).toEqual([
        {'actionActor': 'Marco', 'actionType': 'Pick Weapon', 'element': 'Shotgun'},
        {'actionActor': 'Marco', 'actionType': 'Shoot Weapon', 'element': 'Shotgun'},
        {'actionActor': 'RAT1', 'actionType': 'Receive Attack', 'fromActor': 'Marco'}]
    );
});
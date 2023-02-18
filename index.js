// gene connections start with inner neurons so the beginning and end are the same. Ex: 010 for beginning and 0010 for end are the same neuron if there are at least 010 inner neurons

// todo:
// have variables instead of always using getBitsRequired
// have functions to replace inputTrait, outputTrait, weight rather than having to substring
// input field limits and validation
// show mutations slider
// hide select dropdown on select
// add more goals - minimize connections? distance from others? distance traveled?
// add more nodes - kill?
// show percent success?
// non-binary goals - goal weights
// highlight selected entity? - sometimes doesn't work
// make input nodes connect to each other in neural network diagram
// make connections not overlap completely? be able to move neural network nodes around?
// what happens when all input or output nodes are disabled?
// switch up and down nodes
// positive input node acts like a bias, but should still add an inherent bias

// crashes: change entities to 1. increase entities while playing

class Neuron {
  constructor(entity) {
    this.value = 0
    this.entity = entity
  }
}

class Connection {
  constructor(weight, input_node, output_node) {
    this.weight = weight
    this.input_node = input_node
    this.output_node = output_node
  }
  
  cycle() {
    return this.input_node.cycle() * this.weight / Math.pow(2, precision - 1)
  }
}

class Input extends Neuron {
  constructor(entity) {
    super(entity);
    this.output_connections = []
  }
}
  
class Output extends Neuron {
  constructor(entity) {
    super(entity);
    this.input_connections = []
  }
}

class Inner extends Neuron {
  constructor(entity, id) {
    super(entity);
    this.input_connections = []
    this.output_connections = []
    this.id = id;
  }

  cycle() {
    let value = 0

    for (const connection of this.input_connections) {
      value += connection.cycle()
    }

    return value /= this.input_connections.length
  }
}

class RandomInput extends Input {
  cycle() {
    return Math.random()
  }
}

class PositiveInput extends Input {
  cycle() {
    return 1
  }
}

class NegativeInput extends Input {
  cycle() {
    return -1
  }
}

class XInput extends Input {
  cycle() {
    return this.entity.x / this.entity.x_bound;
  }
}

class RightOutput extends Output {
  cycle() {
    let value = 0

    for (const connection of this.input_connections) {
      value += connection.cycle()
    }

    value /= this.input_connections.length

    if (value * reactiveness > Math.random()) {
      this.entity.move(1, 0)
    }
  }
}

class UpOutput extends Output {
  cycle() {
    let value = 0

    for (const connection of this.input_connections) {
      value += connection.cycle()
    }

    value /= this.input_connections.length

    if (value * reactiveness > Math.random()) {
      this.entity.move(0, 1)
    }
  }
}

class LeftOutput extends Output {
  cycle() {
    let value = 0

    for (const connection of this.input_connections) {
      value += connection.cycle()
    }

    value /= this.input_connections.length

    if (value * reactiveness > Math.random()) {
      this.entity.move(-1, 0)
    }
  }
}

class DownOutput extends Output {
  cycle() {
    let value = 0

    for (const connection of this.input_connections) {
      value += connection.cycle()
    }

    value /= this.input_connections.length

    if(value * reactiveness > Math.random()) {
      this.entity.move(0, -1)
    }
  }
}

let InputNodes = [
  Inner,
  RandomInput,
  PositiveInput,
  NegativeInput,
  XInput
]

let OutputNodes = {
  0: Inner,
  1: RightOutput,
  2: UpOutput,
  3: LeftOutput,
  4: DownOutput
}

const EnabledInputNodes = {
  0: 'randomInput',
  1: 'positiveInput',
  2: 'negativeInput',
  3: 'xInput',
  4: 'inner'
}

const EnabledOutputNodes = {
  0: 'rightOutput',
  1: 'upOutput',
  2: 'leftOutput',
  3: 'downOutput',
  4: 'inner'
}

const InputNodeClasses = {
  0: RandomInput,
  1: PositiveInput,
  2: NegativeInput,
  3: XInput
}

const OutputNodeClasses = {
  0: RightOutput,
  1: UpOutput,
  2: LeftOutput,
  3: DownOutput
}

const NodeAbbreviations = {
  'RandomInput': 'R',
  'PositiveInput': 'P',
  'NegativeInput': 'N',
  'XInput': 'X',
  'Inner': 'I',
  'RightOutput': 'R',
  'UpOutput': 'U',
  'LeftOutput': 'L',
  'DownOutput': 'D'
}

let precision = 8 // number of bits used for connection weight
let inner_count = 1
let connections = 5
let mutationProbability = .1
let reactiveness = 1
let input_count = InputNodes.length - inner_count
let output_count = Object.keys(OutputNodes).length - inner_count
let inputTraitLength = get_bits_required(input_count + inner_count)
let outputTraitLength = get_bits_required(output_count + inner_count)
let gene_length = get_gene_length();
let canvas = document.getElementById("canvas");
let context = canvas.getContext("2d");
let neuralNetworkCanvas = document.getElementById("neuralNetworkCanvas");
let neuralNetworkContext = neuralNetworkCanvas.getContext("2d");
context.fillStyle = "#eeeeee";
neuralNetworkContext.fillStyle = "#eeeeee";
neuralNetworkContext.strokeStyle = "#eeeeee";
neuralNetworkContext.font = "30px Monospace";
canvas.addEventListener('click', (e) => click(e), false);
let can_overlap = false;

let entities = null;
let entitiesPositionIndex = null;
let spaces = [];
let selectedEntity;

resetSpaces();

let playing = false;
let testCycle = 0;
let generation = 0;
let cycle = 0;
let speed = 5;
let amount = 100;
let cycles = 100;
let enabledInputNodes = [true, true, true, true];
let enabledOutputNodes = [true, true, true, true];
let drawingData = null;
let nextRunId = 0;
let nextTestRunId = 0;
let drawnNeuralNetworkGenome = undefined

let inputSelectors = [];
let outputSelectors = [];
let weightSelectors = [];
let weightTexts = [];

document.getElementById('cycles').value = cycles;
document.getElementById('entities').value = amount;
document.getElementById('precision').value = precision;
document.getElementById('connections').value = connections;
document.getElementById('mutationProbability').value = mutationProbability;
document.getElementById('reactiveness').value = reactiveness;
document.getElementById('inner').value = inner_count;
document.getElementById('speed').value = speed;

setInputAndOutputNodes();

function get_gene_length() {
  return get_bits_required(input_count + inner_count) + get_bits_required(inner_count + output_count) + precision
}

function get_bits_required(number) {
  let largest_value = 2
  let bits = 1

  while (largest_value < number) {
    bits += 1
    largest_value *= 2
  }

  return bits
}

class Entity {
  constructor(isTest) {
    this.isTest = isTest;
    this.genome = []
    this.biases = []
    this.input_neurons = []
    this.inner_neurons = []
    this.output_neurons = []
    this.neurons = []
    if (!(document.getElementById('allowOverlap').checked)) {
      while (true) {
        this.x = Math.floor(Math.random() * 100)
        this.y = Math.floor(Math.random() * 100)
        if (!spaces[this.x][this.y]) {
          break;
        }
      }
      spaces[this.x][this.y] = true;
    }
    else {
      this.x = Math.floor(Math.random() * 100)
      this.y = Math.floor(Math.random() * 100)
    }
    this.x_bound = 100
    this.y_bound = 100
  }

  combine(entity) {
    let child = new Entity();
    let genome = []
    
    for (let i = 0; i < connections; i++) {
      let input_connection_genome = null
      let output_connection_genome = null

      if (Math.random() < .5) {
        input_connection_genome = this.get_input_connection_genome(i)
      }
      else {
        input_connection_genome = entity.get_input_connection_genome(i)
      }

      if (Math.random() < .5) {
        output_connection_genome = this.get_output_connection_genome(i)
        if (genomeStringToNumber(input_connection_genome) === genomeStringToNumber(output_connection_genome) && genomeStringToNumber(input_connection_genome) < inner_count) {
          output_connection_genome = entity.get_output_connection_genome(i)
        }
      }
      else {
        output_connection_genome = entity.get_output_connection_genome(i)
        if (genomeStringToNumber(input_connection_genome) === genomeStringToNumber(output_connection_genome) && genomeStringToNumber(input_connection_genome) < inner_count) {
          output_connection_genome = this.get_output_connection_genome(i)
        }
      }

      let gene = input_connection_genome + output_connection_genome

      if (Math.random() < .5) {
        gene += this.get_connection_weight_genome(i)
      }
      else {
        gene += entity.get_connection_weight_genome(i)
      }

      genome.push(genomeStringToNumber(gene))
    }

    child.genome = genome

    for (const gene of child.genome) {
      testValidateGene(gene)
    }

    return child
  }

  mutate() {
    if (Math.random() > mutationProbability)
      return
    
    // todo: should we compute all valid mutations and pick a random one from there? then this won't have the possibility of running forever
    //       or should we just try random mutations until a limit? Starting from base each time and resetting if invalid. Try x times then give up
    //       going with second approach for now. First approach would be easy because we only have <gene_length> possibilities for mutating one number,
    //       so just try random ones without repeating until one is valid

    let index = Math.floor(Math.random() * connections)

    let old_gene = genomeNumberToString(this.genome[index], gene_length)

    let new_gene

    let mutated = false

    for (let i = 0; i < 10; i++) {
      let mutation_index = Math.floor(Math.random() * gene_length)

      new_gene = old_gene.slice(0, mutation_index) + +(genomeStringToNumber(old_gene.slice(mutation_index, mutation_index + 1)) != 1) + old_gene.slice(mutation_index + 1)

      if (validateGene(new_gene)) {
        mutated = true
        break
      }
    }

    if (mutated) {
      let new_genome = this.genome.slice(0, index)

      new_genome.push(genomeStringToNumber(new_gene))
  
      new_genome.push(...this.genome.slice(index + 1))
  
      this.genome = new_genome
    }

    for (let i = 0; i < this.genome.length; i++) {
      if (genomeStringToNumber(this.get_output_connection_genome(i)) >= output_count + inner_count) {
        throw new Error('Output trait too large after mutate: ' + genomeStringToNumber(this.get_output_connection_genome(i)))
      }
    }
  }

  generate_genome() {
    for (let i = 0; i < connections; i++) {
      let connection_start = null
      let connection_end = null
      while (true) {
        connection_start = Math.floor(Math.random() * (input_count + inner_count))
        connection_end = Math.floor(Math.random() * (inner_count + output_count))

        if (!(connection_start === connection_end && connection_start < inner_count)) { // if nodes are the same (can only be same if inner nodes)
          break
        }
      }

      // todo: why do we do the break check? Should we just not have a while loop and set the start and end once no matter what?

      let p = Math.floor(Math.random() * (Math.pow(2, precision) - 2));

      let a = genomeStringToNumber(
        genomeNumberToString(connection_start, get_bits_required(input_count + inner_count)) + 
        genomeNumberToString(connection_end, get_bits_required(inner_count + output_count)) + 
        genomeNumberToString(p, get_bits_required(Math.pow(2, precision)))
      )
      this.genome.push(
        a
      );
    }
  }

  move(x, y) {
    let oldX = this.x
    let oldY = this.y

    let new_x = this.x + x
    let new_y = this.y + y

    if (!(new_x >= 0 && new_x < this.x_bound) && !(new_y >= 0 && new_y < this.y_bound)) {
      return
    }
    else if (!(new_x >= 0 && new_x < this.x_bound)) {
      new_x = oldX;
    }
    else if (!(new_y >= 0 && new_y < this.y_bound)) {
      new_y = oldY;
    }

    if (document.getElementById('allowOverlap').checked || this.isTest) {
      this.x = new_x;
      this.y = new_y;
    }
    else {
      if (!spaces[new_x][new_y]) {
        this.x = new_x
        this.y = new_y
      }
      else if (!spaces[new_x][this.y] && !spaces[this.x][new_y]) { // random case to move x or y if either are free
        if (Math.random() < .5) {
          this.x = new_x
        }
        else {
          this.y = new_y
        }
      }
      else if (!spaces[new_x][this.y]) {
        this.x = new_x
      }
      else if (!spaces[this.x][new_y]) {
        this.y = new_y
      }

      spaces[oldX][oldY] = false;
      spaces[this.x][this.y] = true;
    }
  }

  get_input_connection_genome(connection) {
    return genomeNumberToString(this.genome[connection], gene_length).substring(0, get_bits_required(input_count + inner_count))
  }

  get_output_connection_genome(connection) {
    return genomeNumberToString(this.genome[connection], gene_length).substring(get_bits_required(input_count + inner_count), get_bits_required(input_count + inner_count) + get_bits_required(inner_count + output_count))
  }

  get_connection_weight_genome(connection) {
    return genomeNumberToString(this.genome[connection], gene_length).substring(get_bits_required(input_count + inner_count) + get_bits_required(inner_count + output_count))
  }

  success() {
    for (const goal of Object.values(goals)) {
      if (goal.type === Goals[1]) {
        let x0 = 0;
        let x1 = 0;
        let y0 = 0;
        let y1 = 0;

        if (goal.x1 < goal.x0) {
          x0 = goal.x1
          x1 = goal.x0
        }
        else {
          x0 = goal.x0
          x1 = goal.x1
        }

        if (goal.y1 < goal.y0) {
          y0 = goal.y1
          y1 = goal.y0
        }
        else {
          y0 = goal.y0
          y1 = goal.y1
        }

        if (this.x >= x0 && this.x <= x1 && this.y >= y0 && this.y <= y1) {
          return true;
        }
      }
    }
    return false;
  }

  generate_brain() {
    this.neurons = []
    this.input_neurons = []
    this.inner_neurons = []
    this.output_neurons = []

    for (let i = 0; i < this.genome.length; i++) {
      let input_neuron = null
      let output_neuron = null

      let input_connection_genome = this.get_input_connection_genome(i)
      let input_connection_type = genomeStringToNumber(input_connection_genome)

      let exists = false

      for (const neuron of this.neurons) {
        if (neuron instanceof InputNodes[input_connection_type]) {
          if (neuron instanceof Inner) {
            if (neuron.id === input_connection_type) {
              input_neuron = neuron
              exists = true
              break
            }
          }
          else {
            input_neuron = neuron
            exists = true
            break
          }
        }
      }

      if (!exists) {
        if (input_connection_type < inner_count) {
          input_neuron = new Inner(this, input_connection_type)
        }
        else {
          input_neuron = new InputNodes[input_connection_type](this)
        }
        this.neurons.push(input_neuron)
        if (input_neuron instanceof Inner) {
          this.inner_neurons.push(input_neuron)
        }
        else {
          this.input_neurons.push(input_neuron)
        }
      }

      let output_connection_genome = this.get_output_connection_genome(i)
      let output_connection_type = genomeStringToNumber(output_connection_genome)

      exists = false

      for (const neuron of this.neurons) {
        if (neuron instanceof OutputNodes[output_connection_type]) {
          if (neuron instanceof Inner) {
            if (neuron.id === output_connection_type) {
              output_neuron = neuron
              exists = true
              break
            }
          }
          else {
            output_neuron = neuron
            exists = true
            break
          }
        }
      }

      if (!exists) {
        if (output_connection_type < inner_count) {
          output_neuron = new Inner(this, output_connection_type)
        }
        else {
          output_neuron = new OutputNodes[output_connection_type](this)
        }
        this.neurons.push(output_neuron)
        if (output_neuron instanceof Inner) {
          this.inner_neurons.push(output_neuron)
        }
        else {
          this.output_neurons.push(output_neuron)
        }
      }

      let c = new Connection(genomeStringToNumber(this.get_connection_weight_genome(i)) - Math.pow(2, (precision - 1)), input_neuron, output_neuron)

      input_neuron.output_connections.push(c)
      output_neuron.input_connections.push(c)

      if (this.hasCycle()) {
        input_neuron.output_connections.pop()
        output_neuron.input_connections.pop()
      }
    }

    this.removeDuplicatesAndDeadEnds()
  }

  hasCycle() {
    for (const neuron of this.input_neurons) {
      if (this.hasCycleRecursive(neuron, [])) {
        return true
      }
    }
    return false
  }

  hasCycleRecursive(neuron, visited) {
    if (visited.includes(neuron)) {
      return true
    }

    visited.push(neuron);

    if (!neuron.output_connections) {
      return false
    }

    for (const connection of neuron.output_connections) {
      if (this.hasCycleRecursive(connection.output_node, [...visited])) {
        return true;
      }
    }

    return false;
  }

  removeDuplicatesAndDeadEnds() {
    let connectedNeurons = [];

    for (const output_neuron of this.output_neurons) {
      let checked = [];
      let neurons = this.removeDuplicatesAndDeadEndsRecursive(output_neuron, checked)
      if (neurons !== null) {
        for (const neuron of neurons) {
          if (!connectedNeurons.includes(neuron)){
            connectedNeurons.push(neuron)
          }
        }
      }
    }

    let connectedInputNeurons = []
    for (const neuron of this.input_neurons) {
      if (connectedNeurons.includes(neuron)) {
        connectedInputNeurons.push(neuron)

        let connections = []
        for (const connection of neuron.output_connections) {
          if (connection.weight === 0) {
            continue;
          }
          if (connectedNeurons.includes(connection.output_node)) {
            connections.push(connection)
          }
        }
        neuron.output_connections = connections
      }
    }
    this.input_neurons = connectedInputNeurons;

    let connectedInnerNeurons = []
    for (const neuron of this.inner_neurons) {
      if (connectedNeurons.includes(neuron)) {
        connectedInnerNeurons.push(neuron)

        let connections = []
        for (const connection of neuron.input_connections) {
          if (connection.weight === 0) {
            continue;
          }
          if (connectedNeurons.includes(connection.input_node)) {
            connections.push(connection)
          }
        }
        neuron.input_connections = connections

        connections = []
        for (const connection of neuron.output_connections) {
          if (connection.weight === 0) {
            continue;
          }
          if (connectedNeurons.includes(connection.output_node)) {
            connections.push(connection)
          }
        }
        neuron.output_connections = connections
      }
    }
    this.inner_neurons = connectedInnerNeurons;

    let connectedOutputNeurons = []
    for (const neuron of this.output_neurons) {
      if (connectedNeurons.includes(neuron)) {
        connectedOutputNeurons.push(neuron)

        let connections = []
        for (const connection of neuron.input_connections) {
          if (connection.weight === 0) {
            continue;
          }
          if (connectedNeurons.includes(connection.input_node)) {
            connections.push(connection)
          }
        }
        neuron.input_connections = connections
      }
    }
    this.output_neurons = connectedOutputNeurons;

    this.neurons = connectedNeurons;
  }

  removeDuplicatesAndDeadEndsRecursive(neuron, checked) {
    if (checked.includes(neuron)) {
      return null;
    }

    checked.push(neuron);
    if (neuron instanceof Input) {
      return [neuron];
    }
    if (neuron.input_connections.length === 0) {
      return null;
    }
    let subPath = []
    for (const connection of neuron.input_connections) {
      if (connection.weight === 0) {
        continue;
      }
      let subchecked = [...checked]
      let nodes = this.removeDuplicatesAndDeadEndsRecursive(connection.input_node, subchecked)
      if (nodes !== null) {
        subPath.push(...nodes)
      }
    }
    if (subPath.length === 0) {
      return null
    }
    subPath.push(neuron);
    return subPath;
  }
    
  cycle() {
    for (const neuron of this.output_neurons) {
      neuron.cycle()
    }
  }

  getNeuralNetworkData() {
    let connections = []
    let neurons = []

    let maxLength = Math.max(this.input_neurons.length, this.inner_neurons.length);
    maxLength = Math.max(maxLength, this.output_neurons.length)

    let input_neuron_offset = (maxLength - this.input_neurons.length) * 40
    let inner_neuron_offset = (maxLength - this.inner_neurons.length) * 40
    let output_neuron_offset = (maxLength - this.output_neurons.length) * 40
    
    for (let i = 0; i < this.input_neurons.length; i++) {
      neurons.push({type: 'neuron', parameters: [25, i * 80 + 25 + input_neuron_offset, NodeAbbreviations[this.input_neurons[i].constructor.name]]})
      for (const connection of this.input_neurons[i].output_connections) {
        if (connection.output_node instanceof Inner) {
          for (let j = 0; j < this.inner_neurons.length; j++) {
            if (connection.output_node == this.inner_neurons[j]) {
               connections.push({type: 'connection', parameters: [25, i * 80 + 25 + input_neuron_offset, 115, j * 80 + 25 + inner_neuron_offset, connection.weight / Math.pow(2, precision - 1)]})
            }
          }
        }
        else {
          for (let j = 0; j < this.output_neurons.length; j++) {
            if (connection.output_node == this.output_neurons[j]) {
              connections.push({type: 'connection', parameters: [25, i * 80 + 25 + input_neuron_offset, 205, j * 80 + 25 + output_neuron_offset, connection.weight / Math.pow(2, precision - 1)]})
            }
          }
        }
      }
    }

    for (let i = 0; i < this.inner_neurons.length; i++) {
      neurons.push({type: 'neuron', parameters: [115, i * 80 + 25 + inner_neuron_offset, NodeAbbreviations[this.inner_neurons[i].constructor.name]]})
      for (const connection of this.inner_neurons[i].output_connections) {
        for (let j = 0; j < this.output_neurons.length; j++) {
          if (connection.output_node == this.output_neurons[j]) {
            connections.push({type: 'connection', parameters: [115, i * 80 + 25 + inner_neuron_offset, 205, j * 80 + 25 + output_neuron_offset, connection.weight / Math.pow(2, precision - 1)]})
          }
        }
      }
    }

    for (let i = 0; i < this.output_neurons.length; i++) {
      neurons.push({type: 'neuron', parameters: [205, i * 80 + 25 + output_neuron_offset, NodeAbbreviations[this.output_neurons[i].constructor.name]]})
    }

    return [[...connections, ...neurons], this.genome];
  }

  reset() {
    this.x = Math.floor(Math.random() * 100)
    this.y = Math.floor(Math.random() * 100)
  }

  replaceInputTrait(newInputTrait, i) {
    this.genome[i] = genomeNumberToString(newInputTrait, get_bits_required(input_count + inner_count)) + gene.substring(get_bits_required(input_count + inner_count))
  }
}

function validateGene(gene) {
  if (getInputTrait(gene, true) >= input_count + inner_count) {
    return false
  }
  if (getOutputTrait(gene, true) >= output_count + inner_count) {
    return false
  }
  return true
}

function getRandomInputTrait(asString) {
  let trait = Math.floor(Math.random() * (input_count + inner_count))

  if (asString) {
    return genomeNumberToString(trait, get_bits_required(input_count + inner_count))
  }
  return trait
}

function getRandomOutputTrait(asString) {
  let trait = Math.floor(Math.random() * (output_count + inner_count))

  if (asString) {
    return genomeNumberToString(trait, get_bits_required(output_count + inner_count))
  }
  return trait
}

function getRandomGene() {
  let connection_start = null
  let connection_end = null
  while (true) {
    connection_start = Math.floor(Math.random() * (input_count + inner_count))
    connection_end = Math.floor(Math.random() * (inner_count + output_count))

    if (!(connection_start === connection_end && connection_start < inner_count)) { // if nodes are the same (can only be same if inner nodes)
      break
    }
  }

  // todo: why do we do the break check? Should we just not have a while loop and set the start and end once no matter what?

  let p = Math.floor(Math.random() * (Math.pow(2, precision) - 2));

  let a = genomeStringToNumber(
    genomeNumberToString(connection_start, get_bits_required(input_count + inner_count)) + 
    genomeNumberToString(connection_end, get_bits_required(inner_count + output_count)) + 
    genomeNumberToString(p, get_bits_required(Math.pow(2, precision)))
  )
  return a
}

function getInputTrait(gene, asNumber, traitLength, geneLength) {
  traitLength = traitLength ?? get_bits_required(input_count + inner_count)

  let trait = genomeNumberToString(gene, geneLength ?? gene_length).substring(0, traitLength)

  if (asNumber) {
    return genomeStringToNumber(trait)
  }
  return trait
}

function getOutputTrait(gene, asNumber, inputTraitLength, outputTraitLength, geneLength) {
  inputTraitLength = inputTraitLength ?? get_bits_required(input_count + inner_count)
  outputTraitLength = outputTraitLength ?? get_bits_required(output_count + inner_count)

  let trait = genomeNumberToString(gene, geneLength ?? gene_length).substring(inputTraitLength, inputTraitLength + outputTraitLength)

  if (asNumber) {
    return genomeStringToNumber(trait)
  }
  return trait
}

function getOutputAndPrecisionTraits(gene, asNumber, geneLength, inputTraitLength) {
  let trait = genomeNumberToString(gene, geneLength ?? gene_length).substring(inputTraitLength ?? get_bits_required(input_count + inner_count))

  if (asNumber) {
    return genomeStringToNumber(trait)
  }
  return trait
}

function getPrecisionTrait(gene, asNumber, geneLength) {
  geneLength = geneLength ?? gene_length

  let trait = genomeNumberToString(gene, geneLength).substring(geneLength - precision)

  if (asNumber) {
    return genomeStringToNumber(trait)
  }
  return trait
}

function drawCycle() {
  clearCanvas();

  if (drawingData) {
    for (let i = 0; i < entities.length; i++) {
      drawEntity(drawingData[i].x, drawingData[i].y, entities[i] === selectedEntity ? "#527ede" : undefined);
    }
  }

  drawGoals();

  document.getElementById('cycle').innerHTML = cycle;
  document.getElementById('generation').innerHTML = generation;
}

function drawNeuralNetwork(data) {
  neuralNetworkContext.clearRect(0, 0, neuralNetworkCanvas.width, neuralNetworkCanvas.height);
  for (const element of data) {
    if (element.type === 'neuron') {
      drawNode(...element.parameters)
    }
    else {
      drawLine(...element.parameters)
    }
  }
}

function drawNode(x, y, name) {
  neuralNetworkContext.beginPath();
  neuralNetworkContext.arc(x, y, 23, 0, 2 * Math.PI);
  neuralNetworkContext.fill();
  neuralNetworkContext.fillStyle = "#888888";
  neuralNetworkContext.fillText(name, x - 8, y + 9);
  neuralNetworkContext.fillStyle = "#eeeeee";
}

function drawLine(x0, y0, x1, y1, width) {
  neuralNetworkContext.beginPath();
  if (width >= 0) {
    width = Math.max(width, .1);
    neuralNetworkContext.lineWidth = width * 10;
    neuralNetworkContext.strokeStyle = '#527ede'
  }
  else {
    width = Math.min(width, -.1);
    neuralNetworkContext.lineWidth = width * -10;
    neuralNetworkContext.strokeStyle = '#de5252'
  }
  neuralNetworkContext.lineWidth = Math.abs(width) * 10;
  neuralNetworkContext.moveTo(x0, y0);
  neuralNetworkContext.lineTo(x1, y1);
  neuralNetworkContext.stroke();
  neuralNetworkContext.lineWidth = 1;
  neuralNetworkContext.strokeStyle = '#eeeeee'
}

function genomeStringToNumber(string) {
  return parseInt(string, 2);
}

function genomeNumberToString(number, length) {
  let string = number.toString(2);
  while (string.length < length) {
    string = '0' + string;
  }
  return string;
}

function drawEntity(x, y, color) {
  if (color) {
    context.fillStyle = color;
  }
  context.beginPath();
  context.fillRect(x * 9, y * 9, 9, 9);
  context.stroke();
  if (color) {
    context.fillStyle = "#eeeeee";
  }
}

function clearCanvas() {
  context.clearRect(0, 0, canvas.width, canvas.height);
}

function playPause() {
  playing = !playing;
  if (playing) {
    document.getElementById('playPause').innerHTML = 'Pause'
  }
  else {
    document.getElementById('playPause').innerHTML = 'Play'
  }
}

function changeSpeed(value) {
  if (value < 0 || value > 10) {
    return
  }

  speed = Math.round(value);
}

function changeCycles(value) {
  if (value < 1) {
    return
  }
  
  cycles = value;
}

function changeEntities(value) {
  if (value < 1) {
    return
  }
  
  amount = value;
}

function changePrecision(value) {
  value = parseInt(value)

  if (isNaN(value) || value < 0) {
    return
  }

  let oldPrecision = precision
  
  precision = value;

  setInputAndOutputNodes()

  // todo: change this to using new function to generate brain and also do for test entity
  for (const entity of entities) {
    updatePrecision(entity, oldPrecision)

    entity.generate_brain()
  }
}

function changeConnections(value) {
  value = parseInt(value)

  if (isNaN(value) || value < 0) {
    return
  }

  let oldConnections = connections
  
  connections = value;

  if (oldConnections < connections) {
    for (const entity of entities) {
      for (let i = 0; i < connections - oldConnections; i++) {
        let newGene = getRandomGene()

        entity.genome.push(newGene)
      }

      entity.generate_brain()
    }
  }
  else {
    for (const entity of entities) {
      for (let i = 0; i < oldConnections - connections; i++) {
        let removedConnection = Math.floor(Math.random() * connections)

        entity.genome.splice(removedConnection, 1)
      }

      entity.generate_brain()
    }
  }
}

function changeMutationProbability(value) {
  if (value < 0) {
    return
  }
  
  mutationProbability = value;
}

function changeReactiveness(value) {
  if (value < 0) {
    return
  }
  
  reactiveness = value;
}

function setInner(value) {
  value = parseInt(value)

  if (isNaN(value) || value < 0) {
    return
  }

  changeInner(undefined, value)
}

function changeInner(delta, newInnerCount) {
  if (delta === undefined) {
    delta = newInnerCount - inner_count
  }
  else {
    newInnerCount = inner_count + delta

    if (newInnerCount < 0) {
      return
    }

    document.getElementById('inner').value = newInnerCount;
  }

  const oldInnerCount = inner_count

  inner_count = newInnerCount

  setInputAndOutputNodes()

  if (entities) {
    for (const entity of entities) {
      updateEntityFromInnerChange(entity, delta)
    }
  }

  if (testEntity) {
    updateEntityFromInnerChange(testEntity, delta)
  }

  generateBrainsAndDrawNeuralNetwork()

  updateTestInputSelectors(delta > 0, inner_count, oldInnerCount, Object.keys(InputNodeClasses).length + inner_count - 1)
  updateTestOutputSelectors(delta > 0, inner_count, oldInnerCount, Object.keys(OutputNodeClasses).length + inner_count - 1)
}

function generateBrainsAndDrawNeuralNetwork() {
  if (document.getElementById('testMode').checked) {
    if (!testEntity) {
      return
    }

    testEntity.generate_brain()

    let [data, genome] = testEntity.getNeuralNetworkData()
    drawnNeuralNetworkGenome = genome
    drawNeuralNetwork(data)
  }
  else {
    if (!entities) {
      return
    }

    for (const entity of entities) {
      entity.generate_brain()
    }

    if (!selectedEntity) {
      return
    }

    let [data, genome] = selectedEntity.getNeuralNetworkData()
    drawnNeuralNetworkGenome = genome
    drawNeuralNetwork(data)
  }
}

function decreaseCycles() {
  if (cycles > 1) {
    cycles--;
    document.getElementById('cycles').value = cycles;
  }
}

function increaseCycles() {
  cycles++;
  document.getElementById('cycles').value = cycles;
}

function decreaseEntities() {
  if (amount > 1) {
    amount--;
    document.getElementById('entities').value = amount;
  }
}

function increaseEntities() {
  amount++;
  document.getElementById('entities').value = amount;
}

function decreasePrecision() {
  if (precision > 1) {
    let oldPrecision = precision
    precision--;
    document.getElementById('precision').value = precision;

    setInputAndOutputNodes()

    for (const entity of entities) {
      updatePrecision(entity, oldPrecision)
    }
  }
}

function increasePrecision() {
  let oldPrecision = precision
  precision++;
  document.getElementById('precision').value = precision;

  setInputAndOutputNodes()

  for (const entity of entities) {
    updatePrecision(entity, oldPrecision)

    entity.generate_brain()
  }
}

function decreaseConnections() {
  if (connections > 1) {
    connections--;
    document.getElementById('connections').value = connections;

    if (entities) {
      for (const entity of entities) {
        let removedConnection = Math.floor(Math.random() * connections)

        entity.genome.splice(removedConnection, 1)
      }
    }

    if (testEntity) {
      let removedConnection = Math.floor(Math.random() * connections)

      testEntity.genome.splice(removedConnection, 1)
    }

    generateBrainsAndDrawNeuralNetwork()
  }
}

function increaseConnections() {
  connections++;
  document.getElementById('connections').value = connections;

  if (entities) {
    for (const entity of entities) {
      let newGene = getRandomGene()

      entity.genome.push(newGene)
    }
  }

  if (testEntity) {
    let newGene = getRandomGene()

    testEntity.genome.push(newGene)
  }

  generateBrainsAndDrawNeuralNetwork()
}

function decreaseMutationProbability() {
  if (mutationProbability >= .1) {
    mutationProbability -= .1;
    mutationProbability = +(Math.round(mutationProbability + "e+2")  + "e-2")
    document.getElementById('mutationProbability').value = mutationProbability;
  }
}

function increaseMutationProbability() {
  if (mutationProbability <= .9) {
    mutationProbability += .1;
    mutationProbability = +(Math.round(mutationProbability + "e+2")  + "e-2")
    document.getElementById('mutationProbability').value = mutationProbability;
  }
}

function decreaseReactiveness() {
  if (reactiveness >= .1) {
    reactiveness -= .1;
    reactiveness = +(Math.round(reactiveness + "e+2")  + "e-2")
    document.getElementById('reactiveness').value = reactiveness;
  }
}

function increaseReactiveness() {
  reactiveness += .1;
  reactiveness = +(Math.round(reactiveness + "e+2")  + "e-2")
  document.getElementById('reactiveness').value = reactiveness;
}

function updateEntityFromInputChange(entity, isAdd, index) {
  let newGenome = []

  let oldInputTraitLength = get_bits_required(input_count + inner_count - (isAdd ? 1 : -1))
  let oldGeneLength = oldInputTraitLength + outputTraitLength + precision

  for (const gene of entity.genome) {
    let oldInputTrait = getInputTrait(gene, true, oldInputTraitLength, oldGeneLength)

    let newInputTrait

    if (isAdd) {
      if (oldInputTrait < index) {
        newInputTrait = genomeNumberToString(oldInputTrait, inputTraitLength)
      }
      else {
        newInputTrait = genomeNumberToString(oldInputTrait + 1, inputTraitLength)
      }
    }
    else {
      if (oldInputTrait < index) {
        newInputTrait = genomeNumberToString(oldInputTrait, inputTraitLength)
      }
      else if (oldInputTrait === index) {
        newInputTrait = getRandomInputTrait(true)
      }
      else {
        newInputTrait = genomeNumberToString(oldInputTrait - 1, inputTraitLength)
      }
    }

    let newGene = genomeStringToNumber(newInputTrait + getOutputTrait(gene, false, oldInputTraitLength, undefined, oldGeneLength) + getPrecisionTrait(gene, false, oldGeneLength))

    testValidateGene(newGene)

    newGenome.push(newGene)
  }

  entity.genome = newGenome
}

function updateEntityFromOutputChange(entity, isAdd, index) {
  let newGenome = []

  let oldOutputTraitLength = get_bits_required(output_count + inner_count - (isAdd ? 1 : -1))
  let oldGeneLength = inputTraitLength + oldOutputTraitLength + precision

  for (const gene of entity.genome) {
    let oldOutputTrait = getOutputTrait(gene, true, undefined, oldOutputTraitLength, oldGeneLength)

    let newOutputTrait

    if (isAdd) {
      if (oldOutputTrait < index) {
        newOutputTrait = genomeNumberToString(oldOutputTrait, outputTraitLength)
      }
      else {
        newOutputTrait = genomeNumberToString(oldOutputTrait + 1, outputTraitLength)
      }
    }
    else {
      if (oldOutputTrait < index) {
        newOutputTrait = genomeNumberToString(oldOutputTrait, outputTraitLength)
      }
      else if (oldOutputTrait === index) {
        newOutputTrait = getRandomOutputTrait(true)
      }
      else {
        newOutputTrait = genomeNumberToString(getOutputTrait(oldOutputTrait - 1, outputTraitLength))
      }
    }

    let newGene = genomeStringToNumber(getInputTrait(gene, false, undefined, oldGeneLength) + newOutputTrait + getPrecisionTrait(gene, false, oldGeneLength))

    testValidateGene(newGene)

    newGenome.push(newGene)
  }

  entity.genome = newGenome
}

function updateEntityFromInnerChange(entity, difference) {
  if (difference === 0) {
    throw new Error('Difference is 0')
  }

  let newGenome = []

  for (const gene of entity.genome) {
    let oldInputTraitLength = get_bits_required(input_count + inner_count - difference)
    let oldOutputTraitLength = get_bits_required(output_count + inner_count - difference)
    let oldInnerCount = inner_count - difference
    let oldGeneLength = oldInputTraitLength + oldOutputTraitLength + precision

    let oldInputTrait = getInputTrait(gene, true, oldInputTraitLength, oldGeneLength)
    let oldOutputTrait = getOutputTrait(gene, true, oldInputTraitLength, oldOutputTraitLength, oldGeneLength)

    let newInputTrait
    let newOutputTrait

    if (difference < 0) { // if we removed one or more inner nodes
      if (oldInputTrait < inner_count) { // if the trait is less than all removed traits
        newInputTrait = genomeNumberToString(oldInputTrait, inputTraitLength)
      }
      else if (oldInputTrait >= oldInnerCount) {
        newInputTrait = genomeNumberToString(oldInputTrait + difference, inputTraitLength)
      }
      else {
        newInputTrait = getRandomInputTrait(true)
      }

      if (oldOutputTrait < inner_count) { // if the trait is less than all removed traits
        newOutputTrait = genomeNumberToString(oldOutputTrait, outputTraitLength)
      }
      else if (oldOutputTrait >= oldInnerCount) {
        newOutputTrait = genomeNumberToString(oldOutputTrait + difference, outputTraitLength)
      }
      else {
        newOutputTrait = getRandomOutputTrait(true)
      }
    }
    else {
      if (oldInputTrait < oldInnerCount) {
        newInputTrait = genomeNumberToString(oldInputTrait, inputTraitLength)
      }
      else {
        newInputTrait = genomeNumberToString(oldInputTrait + difference, inputTraitLength)
      }

      if (oldOutputTrait < oldInnerCount) {
        newOutputTrait = genomeNumberToString(oldOutputTrait, outputTraitLength)
      }
      else {
        newOutputTrait = genomeNumberToString(oldOutputTrait + difference, outputTraitLength)
      }
    }

    let newGene = genomeStringToNumber(newInputTrait + newOutputTrait + getPrecisionTrait(gene, false, oldGeneLength))

    testValidateGene(newGene)

    newGenome.push(newGene)
  }

  entity.genome = newGenome
}

function decreaseSpeed() {
  if (speed >= 1) {
    speed --;
    document.getElementById('speed').value = speed;
  }
}

function increaseSpeed() {
  if (speed <= 9) {
    speed ++;
    document.getElementById('speed').value = speed;
  }
}

function click(e) {
  if (document.getElementById('testMode').checked) {
    return;
  }
  const x = Math.floor(e.offsetX / (e.target.clientWidth / 100));
  const y = Math.floor(e.offsetY / (e.target.clientHeight / 100));
  if (selectedEntity && !(selectedEntity.x === x && selectedEntity.y === y)) {
    drawEntity(selectedEntity.x, selectedEntity.y)
  }
  if (!entitiesPositionIndex || !(x in entitiesPositionIndex) || !(y in entitiesPositionIndex[x]) || entitiesPositionIndex[x][y].length === 0) {
    selectedEntity = undefined;
    return;
  }
  drawEntity(x, y, "#527ede")
  selectedEntity = entitiesPositionIndex[x][y][0]
  let [data, genome] = entitiesPositionIndex[x][y][0].getNeuralNetworkData()
  drawnNeuralNetworkGenome = genome
  drawNeuralNetwork(data)
}

function showGoals() {
  drawCycle();
}

function enableDisableInputNode(index) {
  enabledInputNodes[index] = !enabledInputNodes[index]; // todo: do we need enabledInputNodes? can we just use the dom element state?

  setInputAndOutputNodes();

  let traitIndex = inner_count

  for (let i = 0; i < index; i++) {
    if (enabledInputNodes[i]) {
      traitIndex++
    }
  }

  let isAdd

  if (enabledInputNodes[index]) {
    document.getElementById(EnabledInputNodes[index]).className = 'nodeSelected';

    isAdd = true
  }
  else {
    document.getElementById(EnabledInputNodes[index]).className = 'node';

    isAdd = false
  }

  if (entities) {
    for (const entity of entities) {
      updateEntityFromInputChange(entity, isAdd, traitIndex)
    }
  }

  if (testEntity) {
    updateEntityFromInputChange(testEntity, isAdd, traitIndex)
  }

  generateBrainsAndDrawNeuralNetwork()

  updateTestInputSelectors(isAdd, traitIndex, undefined, index)
}

function enableDisableOutputNode(index) {
  enabledOutputNodes[index] = !enabledOutputNodes[index];

  setInputAndOutputNodes(); // todo: split and change to only setting input or output for performance

  let traitIndex = inner_count

  for (let i = 0; i < index; i++) {
    if (enabledOutputNodes[i]) {
      traitIndex++
    }
  }

  let isAdd

  if (enabledOutputNodes[index]) {
    document.getElementById(EnabledOutputNodes[index]).className = 'nodeSelected';

    isAdd = true
  }
  else {
    document.getElementById(EnabledOutputNodes[index]).className = 'node';

    isAdd = false
  }

  if (entities) {
    for (const entity of entities) {
      updateEntityFromOutputChange(entity, isAdd, traitIndex)
    }
  }

  if (testEntity) {
    updateEntityFromOutputChange(testEntity, isAdd, traitIndex)
  }

  generateBrainsAndDrawNeuralNetwork()

  updateTestOutputSelectors(isAdd, traitIndex, undefined, index)
}

function run() {
  document.getElementById('run').className = ''
  document.getElementById('canvas').className = ''
  document.getElementById('canvasControls').className = ''

  entities = []
  resetSpaces();
  cycle = 0
  generation = 0

  for (let i = 0; i < amount; i++) {
    entities.push(new Entity())
  }

  indexEntities();
    
  for (const entity of entities) {
    entity.generate_genome()
  }

  selectedEntity = undefined;

  runCycle(nextRunId++);
}

function runCycle(id) {
  if (id !== nextRunId - 1) {
    return;
  }

  if (!playing && !(generation === 0 && cycle === 0)) {
    setTimeout(() => wait(id))
    return;
  }

  if (cycle === 0) {
    for (const entity of entities) {
      entity.generate_brain()
    }
  }

  drawingData = []

  for (const entity of entities) {
    if (!(cycle === 0 && generation === 0))
    {
      entity.cycle();
    }

    drawingData.push({x: entity.x, y: entity.y})
  }

  if (cycle === cycles - 1) {
    let parents = []

    for (const entity of entities) {
      if (entity.success()) {
        parents.push(entity);
      }
    }

    if (parents.length === 0) {
      parents = [...entities]
    }

    resetSpaces();
    entities = [];

    for (let j = 0; j < amount; j++) {
      entities.push(parents[Math.floor(Math.random() * parents.length)].combine(parents[Math.floor(Math.random() * parents.length)]))
    }

    for (const entity of entities) {
      entity.mutate();
    }
  }

  indexEntities();
  drawCycle();

  cycle++;

  if (cycle === +cycles) {
    cycle = 0;
    generation++;
  }

  if (playing && !document.getElementById('testMode').checked) {
    setTimeout(() => runCycle(id), Math.pow(2, 11 - speed));
  }
  else {
    setTimeout(() => wait(id))
  }
}

function wait(id) {
  if (playing && !document.getElementById('testMode').checked) {
    setTimeout(() => runCycle(id));
  }
  else {
    setTimeout(() => wait(id));
  }
}

function indexEntities() {
  entitiesPositionIndex = {}
  for (const entity of entities) {
    if (entity.x in entitiesPositionIndex) {
      if (entity.y in entitiesPositionIndex[entity.x]) {
        entitiesPositionIndex[entity.x][entity.y].push(entity)
      }
      else {
        entitiesPositionIndex[entity.x][entity.y] = [entity]
      }
    }
    else {
      let temp = {}
        temp[entity.y] = [entity]
        entitiesPositionIndex[entity.x] = temp
    }
  }
}

function createSelect(options, callbacks) {
  const select = document.createElement('div');

  select.className = 'select'

  const space = document.createElement('div');

  space.className = 'space'

  const selected = document.createElement('div');

  selected.className = 'selected';

  selected.appendChild(document.createTextNode(options[0]))

  selected.onmouseenter = () => mouseEnter(select, options.length);
  select.onmouseleave = () => mouseLeave(select);

  const dropdown = document.createElement('div');

  dropdown.className = 'dropdown'

  select.appendChild(selected);
  select.appendChild(dropdown);

  for (let i = 0; i < options.length; i++) {
    const element = document.createElement('div');

    element.appendChild(document.createTextNode(options[i]))

    if (i === 0) {
      element.className = 'option'
    }
    else if(i < options.length - 1) {
      element.className = 'option'
    }
    else {
      element.className = 'option'
    }

    element.onclick = () => {
      clickOption(selected, options[i], dropdown)
      if (callbacks) callbacks[i]();
    }

    dropdown.appendChild(element);
  }

  return [select, space];
}

function mouseEnter(select, optionsCount) {
  select.style.setProperty('--height', (optionsCount < 3 ? (optionsCount + 1) : 4.5) * 29 + 'px');
}

function mouseLeave(select) {
  select.className = 'select';
}

function clickOption(selected, value, dropdown) {
  selected.removeChild(selected.lastChild)
  selected.appendChild(document.createTextNode(value))
  dropdown.className = 'dropdown';
}

const Goals = {
  0: 'new',
  1: 'position'
}

let goals = {}
let nextGoalId = 0

addGoal(Goals[1], {'x0': 0, 'y0': 0, 'x1': 10, 'y1': 100})

function addGoal(type, parameters) {
  let goal = document.createElement('div');

  goal.className = 'goal';

  let [select, space] = createSelect(['Position Goal'], () => addGoal(Goals[1]))

  goal.appendChild(select)
  goal.appendChild(space)

  const deleteButton = document.createElement('button')

  deleteButton.className = 'deleteButton'
  
  let temp = nextGoalId;

  deleteButton.onclick = () => deleteGoal(temp, goal)

  let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')

  svg.setAttribute('viewbox', '0 0 24 24');
  svg.setAttribute('width', '24px');
  svg.setAttribute('height', '24px');
  
  deleteButton.appendChild(svg);

  let path = document.createElementNS('http://www.w3.org/2000/svg', 'path')

  path.setAttribute('d', 'M8 8 L16 16 Z');
  path.setAttribute('stroke', '#eeeeee');
  
  svg.appendChild(path);

  path = document.createElementNS('http://www.w3.org/2000/svg', 'path')

  path.setAttribute('d', 'M8 16 L16 8 Z');
  path.setAttribute('stroke', '#eeeeee');
  
  svg.appendChild(path);

  goal.appendChild(deleteButton)

  if (type === Goals[1]) {
    goal.appendChild(document.createTextNode('From'))
    const pointA = document.createElement('div')
    const xText = document.createTextNode('x : ')
    const x = document.createElement('input')
    x.className = 'small';
    x.type = 'number'
    x.onchange = (e) => updateGoal(temp, parseInt(e.target.value), 'x0')
    pointA.appendChild(xText);
    pointA.appendChild(x);
    const yText = document.createTextNode('y : ')
    const y = document.createElement('input')
    y.className = 'small';
    y.type = 'number'
    y.onchange = (e) => updateGoal(temp, parseInt(e.target.value), 'y0')
    pointA.appendChild(yText);
    pointA.appendChild(y);
    goal.appendChild(pointA);

    goal.appendChild(document.createTextNode('To'))
    const pointB = document.createElement('div')
    const xTextB = document.createTextNode('x : ')
    const xB = document.createElement('input')
    xB.className = 'small';
    xB.type = 'number'
    xB.onchange = (e) => updateGoal(temp, parseInt(e.target.value), 'x1')
    pointB.appendChild(xTextB);
    pointB.appendChild(xB);
    const yTextB = document.createTextNode('y : ')
    const yB = document.createElement('input')
    yB.className = 'small';
    yB.type = 'number'
    yB.onchange = (e) => updateGoal(temp, parseInt(e.target.value), 'y1')
    pointB.appendChild(yTextB);
    pointB.appendChild(yB);
    goal.appendChild(pointB);

    if (parameters) {
      x.value = parameters.x0;
      y.value = parameters.y0;
      xB.value = parameters.x1;
      yB.value = parameters.y1;

      goals[nextGoalId++] = {'type': type, 'x0': parameters.x0, 'y0': parameters.y0, 'x1': parameters.x1, 'y1': parameters.y1}
    }
    else {
      goals[nextGoalId++] = {'type': type, 'x0': null, 'y0': null, 'x1': null, 'y1': null}
    }
  }

  document.getElementById('goals').insertBefore(goal, document.getElementById('addGoal'))
}

function drawPositionGoal(x0, y0, x1, y1) {
  context.fillStyle = "#eeeeee30";
  context.beginPath();
  context.fillRect(x0 * 9, y0 * 9, (x1 - x0) * 9, (y1 - y0) * 9);
  context.stroke();
  context.fillStyle = "#eeeeee";
}

function drawGoals() {
  if (!document.getElementById('showGoals').checked) {
    return;
  }
  for (const goal of Object.values(goals)) {
    if (goal.type === Goals[1]) {
      drawPositionGoal(goal.x0, goal.y0, goal.x1, goal.y1)
    }
  }
}

function deleteGoal(id, goal) {
  delete goals[id];
  goal.remove()
  drawCycle()
}

function updateGoal(id, e, parameter) {
  goals[id][parameter] = e
  drawCycle()
}

function resetSpaces() {
  if (document.getElementById('allowOverlap').checked) {
    return;
  }
  spaces = [];
  for (let i = 0; i < 100; i++) {
    spaces.push([]);
    for (let j = 0; j < 100; j++) {
      spaces[i].push(false);
    }
  }
}

function test() {
  if (playing) {
    playPause()
  }
}

function addTestGene(index) {
  let gene = document.createElement('div')

  gene.className = 'gene'

  let from = document.createElement('p')
  from.textContent = 'From'

  let options = []
  let callbacks = []

  for (const inputNode of Object.entries(InputNodeClasses)) {
    options.push(inputNode[1].name)
    callbacks.push(() => updateTestGenome(index, inputNode[0]))
  }

  options.push('Inner 0')
  let temp = input_count
  callbacks.push(() => updateTestGenome(index, temp))

  let [fromSelect, fromSpace] = createSelect(options, callbacks)

  inputSelectors.push(fromSelect)

  let div = document.createElement('div')

  div.appendChild(from)
  div.appendChild(fromSelect)
  div.appendChild(fromSpace)

  gene.appendChild(div)

  let to = document.createElement('p')
  to.textContent = 'To'

  options = []
  callbacks = []

  for (const outputNode of Object.entries(OutputNodeClasses)) {
    options.push(outputNode[1].name)
    callbacks.push(() => updateTestGenome(index, undefined, outputNode[0]))
  }

  options.push('Inner 0')
  temp = output_count
  callbacks.push(() => updateTestGenome(index, undefined, temp))

  let [toSelect, toSpace] = createSelect(options, callbacks)

  outputSelectors.push(toSelect)

  div = document.createElement('div')

  div.appendChild(to)
  div.appendChild(toSelect)
  div.appendChild(toSpace)

  gene.appendChild(div)

  let weightLabel = document.createElement('p')
  weightLabel.textContent = 'Weight'

  gene.appendChild(weightLabel)

  let weightText = document.createElement('p')
  weightText.innerHTML = '127'

  weightTexts.push(weightText);

  let weight = document.createElement('input');
  weight.type = 'range'
  weight.min = -Math.pow(2, precision - 1) + 1
  weight.max = Math.pow(2, precision - 1) - 1
  weight.value = weight.max
  weight.className = 'numberSlider'
  weight.onchange = (e) => updateTestGenome(index, undefined, undefined, parseInt(e.target.value) + Math.pow(2, precision - 1))
  weight.oninput = (e) => {weightText.innerHTML = e.target.value}

  weightSelectors.push(weight);

  gene.appendChild(weight)

  gene.appendChild(weightText)

  document.getElementById('test').appendChild(gene)
}

for(let i = 0; i < connections; i++) {
  addTestGene(i)
}

function selectorNeuronToGenomeIndex(i, otherCount) {
  if (i < otherCount) {
    return i + inner_count;
  }
  else {
    return i - otherCount;
  }
}

function genomeNeuronToSelectorIndex(i, otherCount, relevantInnerCount) {
  if (relevantInnerCount === undefined) {
    relevantInnerCount = inner_count
  }
  if (i < relevantInnerCount) {
    return i + otherCount;
  }
  else {
    return i - relevantInnerCount;
  }
}

let testEntity = new Entity(true)
testEntity.genome = []

for (let i = 0; i < connections; i++) {
  testEntity.genome.push(genomeStringToNumber('00100111111111'))
}

function updateTestGenome(index, from, to, weight) {
  let gene = genomeNumberToString(testEntity.genome[index], gene_length);

  if (from !== undefined) {
    from = inputNodeClassToGenomeIndex(from)
    gene = genomeNumberToString(from, get_bits_required(input_count + inner_count)) + gene.substring(get_bits_required(input_count + inner_count))
  }

  if (to !== undefined) {
    to = outputNodeClassToGenomeIndex(to)
    gene = gene.substring(0, get_bits_required(input_count + inner_count)) + genomeNumberToString(to, get_bits_required(output_count + inner_count)) + gene.substring(gene_length - precision)
  }

  if (weight !== undefined) {
    gene = gene.substring(0, gene_length - precision) + genomeNumberToString(weight, precision)
  }

  testEntity.genome[index] = genomeStringToNumber(gene);


  if (document.getElementById('testMode').checked) {
    testEntity.generate_brain();

    let [data, genome] = testEntity.getNeuralNetworkData()
    drawnNeuralNetworkGenome = genome
    drawNeuralNetwork(data)
  }
}

function inputNodeClassToGenomeIndex(inputNodeClass) {
  if (inputNodeClass >= Object.keys(InputNodeClasses).length) { // inputNodeClass is an inner Node
    return inputNodeClass - Object.keys(InputNodeClasses).length
  }

  let genomeIndex = 0

  for (let i = 0; i < inputNodeClass; i++) {
    if (enabledInputNodes[i]) {
      genomeIndex++
    }
  }
  return genomeIndex + inner_count
}

function outputNodeClassToGenomeIndex(outputNodeClass) {
  if (outputNodeClass >= Object.keys(OutputNodeClasses).length) { // outputNodeClass is an inner Node
    return outputNodeClass - Object.keys(OutputNodeClasses).length
  }

  let genomeIndex = 0

  for (let i = 0; i < outputNodeClass; i++) {
    if (enabledOutputNodes[i]) {
      genomeIndex++
    }
  }
  return genomeIndex + inner_count
}

function updatePrecision(entity, oldPrecision) {
  let oldGeneLength = gene_length - precision + oldPrecision
  for (let i = 0; i < entity.genome.length; i++) {
    let weight = genomeStringToNumber(genomeNumberToString(entity.genome[i], oldGeneLength).substring(oldGeneLength - oldPrecision))

    weight *= Math.pow(2, precision - oldPrecision)

    weight = parseInt(weight)

    entity.genome[i] = genomeStringToNumber(genomeNumberToString(entity.genome[i], oldGeneLength).substring(0, oldGeneLength - oldPrecision) + genomeNumberToString(weight, precision))
    
    testValidateGene(entity.genome[i])
  }
}

function testValidateGene(gene) {
  if (typeof(gene) != 'number') {
    throw new Error('gene is not number: ' + gene)
  }

  let geneString = genomeNumberToString(gene, gene_length)
  let inputTrait = getInputTrait(gene, true)
  let outputTrait = getOutputTrait(gene, true)
  let precisionTrait = getPrecisionTrait(gene, true)

  if (inputTrait >= input_count + inner_count) {
    throw new Error('input trait too large: ' + geneString)
  }
  if (outputTrait >= output_count + inner_count) {
    throw new Error('output trait too large: ' + geneString)
  }
  if (precisionTrait >= Math.pow(2, precision)) {
    throw new Error('precision trait too large: ' + geneString + ' ' + precisionTrait)
  }
  if (inputTrait < 0) {
    throw new Error('input trait negative: ' + geneString)
  }
  if (outputTrait < 0) {
    throw new Error('output trait negative: ' + geneString)
  }
  if (precisionTrait < 0) {
    throw new Error('precision trait negative: ' + geneString)
  }
}

function setInputAndOutputNodes() {
  input_count = 0;

  for (const enabled of enabledInputNodes) {
    if (enabled) {
      input_count++;
    }
  }

  inputTraitLength = get_bits_required(input_count + inner_count)

  output_count = 0;

  for (const enabled of enabledOutputNodes) {
    if (enabled) {
      output_count++;
    }
  }

  outputTraitLength = get_bits_required(output_count + inner_count)

  gene_length = get_gene_length();

  InputNodes = []

  for (let i = 0; i < inner_count; i++) {
    InputNodes.push(Inner)
  }

  for (let i = 0; i < enabledInputNodes.length; i++) {
    if (enabledInputNodes[i]) {
      InputNodes.push(InputNodeClasses[i]);
    }
  }

  OutputNodes = {}

  for (let i = 0; i < inner_count; i++) {
    OutputNodes[i] = Inner
  }

  count = inner_count;

  for (let i = 0; i < enabledOutputNodes.length; i++) {
    if (enabledOutputNodes[i]) {
      OutputNodes[count] = OutputNodeClasses[i];
      count++;
    }
  }
}

function runTest() {
  if (playing) {
    playPause();
  }

  testCycle = 0;
  document.getElementById('generation').innerHTML = 0;

  runCycleTest(nextTestRunId++);
}

function runCycleTest(id) {
  if (id !== nextTestRunId - 1) {
    return;
  }

  if (!playing) {
    setTimeout(() => waitTest(id))
    return;
  }

  clearCanvas();

  drawEntity(testEntity.x, testEntity.y);

  if (testCycle !== 0) {
    testEntity.cycle();
    document.getElementById('cycle').innerHTML = testCycle;
  }

  testCycle++

  if (testCycle >= cycles) {
    testCycle = 0;
    testEntity.reset();
  }

  if (playing && document.getElementById('testMode').checked) {
    setTimeout(() => runCycleTest(id), Math.pow(2, 11 - speed));
  }
  else {
    setTimeout(() => waitTest(id));
  }
}

function waitTest(id) {
  if (playing && document.getElementById('testMode').checked) {
    setTimeout(() => runCycleTest(id));
  }
  else {
    setTimeout(() => waitTest(id));
  }
}

function copyToTest() {
  testEntity.genome = drawnNeuralNetworkGenome
  testEntity.generate_brain();

  for (let i = 0; i < testEntity.genome.length; i++) {
    let inputSelectorIndex = genomeNeuronToSelectorIndex(genomeStringToNumber(genomeNumberToString(testEntity.genome[i], gene_length).substring(0, get_bits_required(input_count + inner_count))), input_count)
    clickOption(inputSelectors[i].children[0], inputSelectors[i].children[1].children[inputSelectorIndex].textContent, inputSelectors[i].children[1])

    let outputSelectorIndex = genomeNeuronToSelectorIndex(genomeStringToNumber(genomeNumberToString(testEntity.genome[i], gene_length).substring(get_bits_required(input_count + inner_count), gene_length - precision)), output_count)
    clickOption(outputSelectors[i].children[0], outputSelectors[i].children[1].children[outputSelectorIndex].textContent, outputSelectors[i].children[1])

    let weight = genomeStringToNumber(genomeNumberToString(testEntity.genome[i], gene_length).substring(gene_length - precision)) - Math.pow(2, precision - 1);
    weightTexts[i].innerHTML = weight

    weightSelectors[i].value = weight
  }
}

function toggleTestMode() {
  if (playing) {
    playPause();
  }

  if (document.getElementById('testMode').checked) {
    clearCanvas();

    testEntity.generate_brain();

    let [data, genome] = testEntity.getNeuralNetworkData()
    drawnNeuralNetworkGenome = genome
    drawNeuralNetwork(data)

    drawEntity(testEntity.x, testEntity.y);

    document.getElementById('cycle').innerHTML = testCycle;
    document.getElementById('generation').innerHTML = 0;  

    waitTest(nextTestRunId++)
  }
  else {
    drawCycle();
  }
}

function expandTest() {
  if (document.getElementById('test').className === 'test') {
    document.getElementById('test').style.setProperty('--height', connections * 238 + 74 + 'px');
    document.getElementById('test').className = 'expanded'
  }
  else {
    document.getElementById('test').className = 'test'
  }
}

function expandNeurons() {
  if (document.getElementById('neurons').className === 'test') {
    document.getElementById('neurons').style.setProperty('--height', 8 * 33 + 39 + 'px');
    document.getElementById('neurons').className = 'expanded'
  }
  else {
    document.getElementById('neurons').className = 'test'
  }
}

function expandGoals() {
  if (document.getElementById('goals').className === 'test') {
    // todo: make this height dynamic
    document.getElementById('goals').style.setProperty('--height', '264px');
    document.getElementById('goals').className = 'expanded'
  }
  else {
    document.getElementById('goals').className = 'test'
  }
}

function updateTestInputSelectors(isAdd, index, oldInnerCount, inputNodeClassIndex) {
  for (let i = 0; i < connections; i++) {
    let dropdown = inputSelectors[i].children[1]
    let selectorIndex = genomeNeuronToSelectorIndex(index, input_count, oldInnerCount)

    if (isAdd) {
      const element = document.createElement('div');
      element.className = 'option'

      if (inputNodeClassIndex >= Object.keys(InputNodeClasses).length) { // if adding an inner node
        element.appendChild(document.createTextNode('Inner ' + (inner_count - 1)))
    
        element.onclick = () => {
          clickOption(inputSelectors[i].children[0], 'Inner ' + (inner_count - 1), dropdown)
          updateTestGenome(i, inputNodeClassIndex)
        }

        dropdown.appendChild(element)
      }
      else {
        element.appendChild(document.createTextNode(InputNodeClasses[inputNodeClassIndex].name))

        element.onclick = () => {
          clickOption(inputSelectors[i].children[0], InputNodeClasses[inputNodeClassIndex].name, dropdown)
          updateTestGenome(i, inputNodeClassIndex)
        }

        dropdown.insertBefore(element, dropdown.children[selectorIndex])
      }
    }
    else {
      let removed = dropdown.children[selectorIndex]
      dropdown.removeChild(removed)

      if (removed.textContent === inputSelectors[i].children[0].textContent) { // if we removed the selected neuron, update the selected text
        inputSelectors[i].children[0].textContent = inputSelectors[i].children[1].children[genomeNeuronToSelectorIndex(getInputTrait(testEntity.genome[i], true), input_count)].textContent
      }
    }
  }
}

function updateTestOutputSelectors(isAdd, index, oldInnerCount, outputNodeClassIndex) {
  for (let i = 0; i < connections; i++) {
    let dropdown = outputSelectors[i].children[1]
    let selectorIndex = genomeNeuronToSelectorIndex(index, output_count, oldInnerCount)

    if (isAdd) {
      const element = document.createElement('div');
      element.className = 'option'

      if (outputNodeClassIndex >= Object.keys(OutputNodeClasses).length) { // if adding an inner node
        element.appendChild(document.createTextNode('Inner ' + (inner_count - 1)))
    
        element.onclick = () => {
          clickOption(outputSelectors[i].children[0], 'Inner ' + (inner_count - 1), dropdown)
          updateTestGenome(i, undefined, outputNodeClassIndex)
        }

        dropdown.appendChild(element)
      }
      else {
        element.appendChild(document.createTextNode(OutputNodeClasses[outputNodeClassIndex].name))

        element.onclick = () => {
          clickOption(outputSelectors[i].children[0], OutputNodeClasses[outputNodeClassIndex].name, dropdown)
          updateTestGenome(i, undefined, outputNodeClassIndex)
        }

        dropdown.insertBefore(element, dropdown.children[selectorIndex])
      }
    }
    else {
      let removed = dropdown.children[selectorIndex]
      dropdown.removeChild(removed)

      if (removed.textContent === outputSelectors[i].children[0].textContent) { // if we removed the selected neuron, update the selected text
        outputSelectors[i].children[0].textContent = outputSelectors[i].children[1].children[genomeNeuronToSelectorIndex(getOutputTrait(testEntity.genome[i], true), output_count)].textContent
      }
    }
  }
}
# Life

Life is an application in which a user can define goals and constraints for Entities that use the Genetic Algorigm and Neural Networks to try to meet said goals.

This application uses vanilla JavaScript and does not require anything additional to run. Just download (3 files), unzip, and open index.html in a web browser.

## PLEASE USE CHROME. This is not tested with any other browser and will very likely have major UI issues
## Up and down neurons are currently switched (oops)

![image](https://github.com/MathiasStrohkirch/Life/assets/42854178/95da4de7-3b1b-46dc-b5ad-388936cfee89)

## Entities
Entities are 1x1 beings that exist in a 100x100 2D world. Each Entity has a Neural Network brain that determiens its behavior.

## Genetic Algorithm
Entities start off with randomized brains that follow user-defined constraints. Entities then perform a user-defined number of steps (each step is one run through the entity's brain) this is one Generation. At the end of the Generation, Entities are evaluated against the user-defined goals. Entities who succeed are used as parents to create a new Generation of Entities. These Entities then have a random chance to mutate. This process continues indefinitely

## User Interface
There is a left column, the world, and a right column. The left column has user-defined parameters that affect the simulation. This includes parameters like number of entites, goals, and available neurons. The world is where entities are displayed. Click on an entity to see its brain. The right column has user-defined parameters that do not affect the simulation directly, but affect the viewing of the simulation. This includes parameters like the simulation speed, if goals are shown or not, and if mutations are shown or not. There is also a Test mode that can be used to test a specific brain configuration.

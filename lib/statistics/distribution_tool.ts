export default class DistributionTool{
  /**
   * https://wiki.q-researchsoftware.com/wiki/How_to_Generate_Random_Numbers:_Poisson_Distribution
   * https://en.wikipedia.org/wiki/Poisson_distribution#Generating_Poisson-distributed_random_variables
   * https://gist.github.com/ferreiro/2b5caac126b58bebce82 => not using
   * @param k 
   * @param lambda 
   */
  static poisson(lambda:number):number {
    var L = Math.exp(-lambda);
    var p = 1.0;
    var k = 0;

    do {
      k++;
      p *= Math.random();
    } while (p > L);

    return k - 1;
  }
    
}
const cluster = require('cluster');
const app = require('express')();
// const app = express();

// Count the machine's CPUs
const cpuCount = require('os').cpus().length;


if(cluster.isMaster){
    var numReqs = 0;

    // Create a worker for each CPU
    for (var i = 0; i < cpuCount; i ++) {
        cluster.fork();
    }

    Object.keys(cluster.workers).forEach((id) => {
        cluster.workers[id].on('message', (msg)=>{
            // Count requests
            if (msg.cmd && msg.cmd == 'notifyRequest') {
                numReqs += 1;
                console.log(numReqs + " from " +  cluster.workers[id].id);
            }
        });
    });


    cluster.on('exit', function (worker) {

        // Replace the dead worker
        console.log('Worker %d died :(', worker.process.pid);
        cluster.fork();

    });

    cluster.on('online', function(worker) {
        console.log('worker online: '+ worker.id + "process id " + worker.process.pid);
    });


}else {

    var count = 0;
    app.get('/', function (req, res) {

        count++;

        // notify master about the request
        process.send({ cmd: 'notifyRequest' });
        res.send('WorkerID: '+ cluster.worker.id + ', Hello from Worker ' + process.pid + 'index = ' + count);

        if (count === 3){
            cluster.worker.kill();
        }
    });

    // Bind to a port
    app.listen(3000);

}

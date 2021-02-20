



var pacman = (function(){

	var current={},
		timeLimit,
		mapPositionStore=[],
		mapWidth = 21,
		mapHeight = 21,
		version = 'v20210120'


	//初始化
	//传入 当前位置，时间限制	
	function ready(no, timeLimit) {
		mapPositionStore=[];
		//保存当前位置
		current.intPosition = no;
		//保存时间限制
		timeLimit = timeLimit;
		//初始化位置关系
		initMapPositionStore();
	}

	//动作方法
	function run(board,strength) {
		
		//得到当前位置周围4个位置的坐标
		var aroundPosition = getAroundPosition(current.intPosition,board,strength,3);

		//判断应该向哪个方向移动
		var direction = aroundPosition.getDirection();

		//返回方向
	    return direction;
	}

	//把二维坐标变成整数
	function computePosition(position){
		
		//返回坐标对应的整数
		var intPosition;
		//X轴
		var x = position.x;
		//Y轴
		var y = position.y;

		//坐标（x,y）转换为 整数的规则
		//活动方提供的规则
		intPosition = 21*x+y;

		//返回的整数位置
		return intPosition;
	}

	//得到所有位置的对应关系
	//活动规则为：X轴，Y轴分别为 21个格子
	//双重循环计算出每个格子的（x,y）坐标与对应的整数坐标的关系，并存储到mapPositionStore数组中
	//数组结构：
	//key:整数坐标
	//value:(x,y)坐标
	function initMapPositionStore(){
		for(var x = 0; x<mapWidth; x++){
			for(var y = 0; y <mapHeight; y++){
				var position = {x:x,y:y};
				mapPositionStore[computePosition(position)] = position;
			}
		}
	}


	//得到上下左右四个坐标
	function getAroundPosition(currentIntPosition,board,strength,deep){

		//得到当前位置坐标
		var position = mapPositionStore[currentIntPosition];

		var directionWeightObjectArray = [];

		//边界处理坐标
		//positionXorY 当前位置的X或Y的位置
		//step 步长
		//逻辑
		//如果positionXorY===0 ，step>0 正常向前走 positionXorY+=step
		//如果positionXorY===0 ，step<0 穿墙 positionXorY变为20
		//如果positionXorY===20，step>0 穿墙 positionXorY变为0
		//如果positionXorY===20，step<0 正常向回走 positionXorY+=step
		function handleBorderPosition(positionXorY,step){
			
			var nextPositionXorY = positionXorY;

			if(positionXorY === 0){
				if(step > 0) {
					nextPositionXorY += step;
				}else if(step < 0 ){
					nextPositionXorY = 20;
				}
			} else if(positionXorY === 20) {
				if(step > 0) {
					nextPositionXorY = 0;
				}else if(step < 0 ){
					nextPositionXorY += step;
				}
			} else {
				nextPositionXorY += step;
			}
			return nextPositionXorY;
		}


		//方向权重
		//
		//-1 代表 ghost
		//-2 代表 空
		//-3 代表 大豆子
		//-4 代表 小豆子
		//-5 / -6 / -7 代表不同的障碍物
		//>=0 代表 其他玩家 或自己的力量  
		function getDirectionWeight(strength){

			//方向权重
			//默认为0
			var directionWeight = 0;
			
			//玩家
			if(this.body()>0){

				//如果我方力量大于对方
				if(strength>this.body()){

					// dirWeight = this.flag;
					// 设置权重为10
					directionWeight = 10;

				}
				//如果我方力量>10000 表示无敌
				//权重=100
				if(strength >= 10000){
					directionWeight = 100;
				}

			}

			//食物或障碍物
			if(this.body()<0){
				//如果是魔鬼，权重为0
				if(this.body() === -1){
					directionWeight = 0;
				}
				//如果我方力量>10000 表示无敌
				//权重=100
				if(strength >= 10000){
						directionWeight = 100;
				}
				//如果是空，大豆子，小豆子 权重为10
				if(this.body() === -2 || this.body() === -3 || this.body() === -4){
					directionWeight = 10;
				}

			}

			//权重大于0
			if(directionWeight){

				//搜索深度默认3
				//周围搜索三层
				if(deep){

					//每次进入，深度-1
					deep--;
					//得到当前层级的周围坐标位置
					this.getAround();

					//权重累加
					//左
					if(this.flag === 1){
						directionWeight += this.up.getDirectionWeight(strength) + this.left.getDirectionWeight(strength) + this.bottom.getDirectionWeight(strength);	
					}
					//上
					if(this.flag === 2){
						directionWeight += this.up.getDirectionWeight(strength) + this.right.getDirectionWeight(strength) + this.left.getDirectionWeight(strength);	
					}
					//右
					if(this.flag === 3){
						directionWeight += this.bottom.getDirectionWeight(strength) + this.right.getDirectionWeight(strength) + this.up.getDirectionWeight(strength);	
					}
					//下
					if(this.flag === 4){
						directionWeight += this.left.getDirectionWeight(strength) + this.right.getDirectionWeight(strength) + this.bottom.getDirectionWeight(strength);	
					}
				}
			}

			//保存坐标以及方向权重
			var directionWeightObject = {};
			directionWeightObject.target = this,
			directionWeightObject.directionWeight = directionWeight;			
			directionWeight && directionWeightObjectArray.push(directionWeightObject);

			//返回权重
			return directionWeight;
		}

		//得到当前坐标上的物品
		function getBoard(){
			return board[this.intPosition()];
		}

		//根据目标的到地图上所有目标的位置
		//坐标上的东西如下
		//-1 代表 ghost
		//-2 代表 空
		//-3 代表 大豆子
		//-4 代表 小豆子
		//-5 / -6 / -7 代表不同的障碍物
		//>=0 代表 其他玩家 或自己的力量  
		// 
		//
		//board 当前所有坐标点上的物品列表
		//targets 可以空 为搜索所有物品种类，物品种类也可以指定
		function getPosition(board,targets){
			
			targets = targets || {
				ghost:-1,  		//魔鬼
				bigBeans : -3,	//大豆子
				smallBeans : -4,//小豆子
				barOnes : -5,	//
				barTwos : -6,	//其他障碍物
				barThrees : -7	//
			}

			//返回的对象，分类别返回
			var intPositionObj = {};
			intPositionObj.ghosts=[];    //魔鬼
			intPositionObj.beans=[];	 //豆子（大豆子，小豆子）
			intPositionObj.bars = [];    //所有障碍物
			intPositionObj.players = []; //其他玩家

			//循环传入的当前物品列表，得到Key
			//根据key得到该坐标上的物品，分别判断是什么种类并把Key存储起来
			for(var intPosition in board){
				board[intPosition] === targets.ghost && intPositionObj.ghosts.push(intPosition);
				board[intPosition] === targets.bigBeans && intPositionObj.beans.push(intPosition); 
				board[intPosition] === targets.smallBeans && intPositionObj.beans.push(intPosition); 
				board[intPosition] === targets.barOnes && intPositionObj.bars.push(intPosition); 
				board[intPosition] === targets.barTwos && intPositionObj.bars.push(intPosition); 
				board[intPosition] === targets.barThrees && intPositionObj.bars.push(intPosition); 
				board[intPosition] >=0 && intPositionObj.players.push(intPosition);
			}
			//返回
			return intPositionObj;
		}

		//修改当前坐标
		function go(){
			current.intPosition = computePosition(this);
			if(this.flag === 1){
				//console.log('--向左走一步--',current.intPosition);
			}
			if(this.flag === 2){
				//console.log('--向上走一步--',current.intPosition);
			}
			if(this.flag === 3){
				//console.log('--向右走一步--',current.intPosition);
			}
			if(this.flag === 4){
				//console.log('--向下走一步--',current.intPosition);
			}
	
			return this.flag;
		}

		//得到最终方向
		//根据权重判断应该走哪个方向
		function getFinalDirection(beans,currentIntPosition,directionWeightObjectArray){

			//当前位置
			var currentPosition = mapPositionStore[currentIntPosition];

			if(beans.length){
				//4个象限里 分别存下一步的方向
				var finalPrediction = {
					1:{},
					2:{},
					3:{},
					4:{}
				};

				//循环所有的豆子
				//向有豆子的方向，并且权重大的方向走
				//一下分别对四个象限进行了判断
				//对边界也有处理，可以保证到了边界可以穿墙：0=>20或20=>0
				for(var item in beans){
					var position = mapPositionStore[beans[item]];
					
					//1 第一象限（包括X轴上的点）
					if(position.y <= currentPosition.y && position.x > currentPosition.x ) {
						finalPrediction[1] = finalPrediction[1] || {};
						finalPrediction[1].weight = finalPrediction[1].weight || 0;
						finalPrediction[1].predictDirectionArray = finalPrediction[1].predictDirectionArray || [];
						finalPrediction[1].weight++;
						
						var shortestDistance1X = getShortestDistance(position.x , currentPosition.x);
						var shortestDistance1Y = getShortestDistance(position.y , currentPosition.y);
						if(position.y < currentPosition.y){

							//X轴穿墙
							if(shortestDistance1X < (position.x - currentPosition.x) && shortestDistance1Y === (position.y - currentPosition.y)){
								finalPrediction[1].predictDirectionArray.push(1);
								finalPrediction[1].predictDirectionArray.push(2);
							}

							//Y轴穿墙
							if(shortestDistance1X === (position.x - currentPosition.x) && shortestDistance1Y < (position.y - currentPosition.y)){
								finalPrediction[1].predictDirectionArray.push(3);
								finalPrediction[1].predictDirectionArray.push(4);
							}
							//X,Y轴穿墙
							if(shortestDistance1X < (position.x - currentPosition.x) && shortestDistance1Y < (position.y - currentPosition.y)){
								finalPrediction[1].predictDirectionArray.push(1);
								finalPrediction[1].predictDirectionArray.push(4);
							}
							//不穿墙
							if(shortestDistance1X === (position.x - currentPosition.x) && shortestDistance1Y === (position.y - currentPosition.y)){
								finalPrediction[1].predictDirectionArray.push(2);
								finalPrediction[1].predictDirectionArray.push(3);

							}
						} else {

							//X轴穿墙
							if(shortestDistance1X < (position.x - currentPosition.x)){
								finalPrediction[1].predictDirectionArray.push(1);
							}
							//不穿墙
							if(shortestDistance1X === (position.x - currentPosition.x)){
								finalPrediction[1].predictDirectionArray.push(3);
							}
						}


					}

					//2  第二象限（包括Y轴上的点）
					if(position.y < currentPosition.y && position.x <= currentPosition.x ) {
						finalPrediction[2] = finalPrediction[2] || {};
						finalPrediction[2].weight = finalPrediction[2].weight || 0;
						finalPrediction[2].predictDirectionArray = finalPrediction[2].predictDirectionArray || [];
						finalPrediction[2].weight++;
					
						var shortestDistance2X = getShortestDistance(position.x , currentPosition.x);
						var shortestDistance2Y = getShortestDistance(position.y , currentPosition.y);

						if(position.x < currentPosition.x){

							//X轴穿墙
							if(shortestDistance2X < (currentPosition.x - position.x) && shortestDistance2Y === (currentPosition.y - position.y)){
								finalPrediction[2].predictDirectionArray.push(2);
								finalPrediction[2].predictDirectionArray.push(3);
							}

							//Y轴穿墙
							if(shortestDistance2X === (currentPosition.x - position.x) && shortestDistance2Y < (currentPosition.y - position.y)){
								finalPrediction[2].predictDirectionArray.push(1);
								finalPrediction[2].predictDirectionArray.push(4);
							}
							//X,Y轴穿墙
							if(shortestDistance2X < (currentPosition.x - position.x) && shortestDistance2Y < (currentPosition.y - position.y)){
								finalPrediction[2].predictDirectionArray.push(3);
								finalPrediction[2].predictDirectionArray.push(4);
							}
							//不穿墙
							if(shortestDistance2X === (currentPosition.x - position.x) && shortestDistance2Y === (currentPosition.y - position.y)){
								finalPrediction[2].predictDirectionArray.push(1);
								finalPrediction[2].predictDirectionArray.push(2);
							}
						} else {

							//Y轴穿墙
							if(shortestDistance2Y < (currentPosition.y - position.y)){
								finalPrediction[2].predictDirectionArray.push(4);
							}
							//不穿墙
							if(shortestDistance2Y === (currentPosition.y - position.y)){
								finalPrediction[2].predictDirectionArray.push(2);
							}
						}

					}
					//3 第三象限(包括X轴上的点)
					if(position.y >= currentPosition.y && position.x < currentPosition.x ) {
						finalPrediction[3] = finalPrediction[3] || {};
						finalPrediction[3].weight = finalPrediction[3].weight || 0;
						finalPrediction[3].predictDirectionArray = finalPrediction[3].predictDirectionArray || [];
						finalPrediction[3].weight++;
						

						var shortestDistance3X = getShortestDistance(position.x , currentPosition.x);
						var shortestDistance3Y = getShortestDistance(position.y , currentPosition.y);
						if(position.y > currentPosition.y){

							//X轴穿墙
							if(shortestDistance3X < (currentPosition.x - position.x) && shortestDistance3Y === (position.y - currentPosition.y)){

								finalPrediction[3].predictDirectionArray.push(3);
								finalPrediction[3].predictDirectionArray.push(4);
							}

							//Y轴穿墙
							if(shortestDistance3X === (currentPosition.x - position.x) && shortestDistance3Y < (position.y - currentPosition.y)){

								finalPrediction[3].predictDirectionArray.push(1);
								finalPrediction[3].predictDirectionArray.push(2);
							}
							//X,Y轴穿墙
							if(shortestDistance3X < (currentPosition.x - position.x) && shortestDistance3Y < (position.y - currentPosition.y)){

								finalPrediction[3].predictDirectionArray.push(2);
								finalPrediction[3].predictDirectionArray.push(3);
							}
							//不穿墙
							if(shortestDistance3X === (currentPosition.x - position.x) && shortestDistance3Y === (position.y - currentPosition.y)){

								finalPrediction[3].predictDirectionArray.push(1);
								finalPrediction[3].predictDirectionArray.push(4);
							}
						} else {
							//X轴穿墙
							if(shortestDistance3X < (currentPosition.x - position.x)){
								finalPrediction[3].predictDirectionArray.push(3);
							}
							//不穿墙
							if(shortestDistance3X === (currentPosition.x - position.x)){
								finalPrediction[3].predictDirectionArray.push(1);
							}
						}

					}
					//4 第四象限（包括Y轴上的点）
					if(position.y > currentPosition.y && position.x >= currentPosition.x ) {
						finalPrediction[4] = finalPrediction[4] || {};
						finalPrediction[4].weight = finalPrediction[4].weight || 0;
						finalPrediction[4].predictDirectionArray = finalPrediction[4].predictDirectionArray || [];
						finalPrediction[4].weight++;

						var shortestDistance4X = getShortestDistance(position.x , currentPosition.x);
						var shortestDistance4Y = getShortestDistance(position.y , currentPosition.y);
						if(position.x > currentPosition.x){
							//X轴穿墙
							if(shortestDistance4X < (position.x - currentPosition.x) && shortestDistance4Y === (position.y - currentPosition.y)){
					
								finalPrediction[4].predictDirectionArray.push(1);
								finalPrediction[4].predictDirectionArray.push(4);
							}

							//Y轴穿墙
							if(shortestDistance4X === (position.x - currentPosition.x) && shortestDistance4Y < (position.y - currentPosition.y)){

								finalPrediction[4].predictDirectionArray.push(2);
								finalPrediction[4].predictDirectionArray.push(3);
							}
							//X,Y轴穿墙
							if(shortestDistance4X < (position.x - currentPosition.x) && shortestDistance4Y < (position.y - currentPosition.y)){

								finalPrediction[4].predictDirectionArray.push(1);
								finalPrediction[4].predictDirectionArray.push(2);
							}
							//不穿墙
							if(shortestDistance4X === (position.x - currentPosition.x) && shortestDistance4Y === (position.y - currentPosition.y)){

								finalPrediction[4].predictDirectionArray.push(3);
								finalPrediction[4].predictDirectionArray.push(4);
							}
						} else {
							//Y轴穿墙
							if(shortestDistance4X < (position.x - currentPosition.x)){
								finalPrediction[4].predictDirectionArray.push(2);
							}
							//不穿墙
							if(shortestDistance4X === (position.x - currentPosition.x)){
								finalPrediction[4].predictDirectionArray.push(4);
							}
						}
					}
					return computeFinalDirection(finalPrediction);
				}
			}else{
				return getDirectionByWeight(directionWeightObjectArray);
			}

			function getShortestDistance(l1,l2){
				var distance = Math.abs(l1 - l2);
				var oppositeDistance = 21- distance;

				if(distance<=oppositeDistance) {
					return distance;
				}else{
					return oppositeDistance;
				}
			}

			function computeFinalDirection(finalPrediction){
				
				//得到权重最大的一个象限数据
				var maxWeightQuadrant = {
					weight:0
				};
				for(var quadrant in finalPrediction){
					if(finalPrediction[quadrant].weight > maxWeightQuadrant.weight){
						maxWeightQuadrant = finalPrediction[quadrant];
					} 
				}
				
				var predictDirectionArray = maxWeightQuadrant.predictDirectionArray;

				var directionWeightObjectArray_1 = [];
				for(var index in predictDirectionArray){
					for(var index_1 in directionWeightObjectArray) {
						if(predictDirectionArray[index] === directionWeightObjectArray[index_1].target.flag){
							directionWeightObjectArray_1.push(directionWeightObjectArray[index_1]);
						}
					}
				}

				//无路可走
				if(!directionWeightObjectArray.length) return 0;
				
				//周围没有食物
				if(!directionWeightObjectArray_1.length && directionWeightObjectArray.length) {
					return getDirectionByWeight(directionWeightObjectArray);
				}
				return getDirectionByWeight(directionWeightObjectArray_1);
			}

			//根据权重得到方向
			function getDirectionByWeight(directionWeightObjectArray){

				var directionWeightObject = {
					directionWeight : 0,
					target:{}
				}
				for(var index in directionWeightObjectArray) {
					if(directionWeightObjectArray[index].directionWeight>directionWeightObject.directionWeight){
						directionWeightObject.target = directionWeightObjectArray[index].target;
					}
				}

				return directionWeightObject.target.go();

			}

		}

		//得到方向
		position.getDirection = function(strength){

			//只有一个方向可走
			if(directionWeightObjectArray.length === 1){
				return directionWeightObjectArray[0].target.go();
			}
			//没有方向可走
			if(directionWeightObjectArray.length === 0){
				return 0;
			}
			//右许多方向选择
			if(directionWeightObjectArray.length > 1){
				var intPositionObj = getPosition(board);
				return getFinalDirection(intPositionObj.beans,currentIntPosition,directionWeightObjectArray);
			}

			return -1;
		}

		//得到坐标的整数
		function intPosition(){
			return computePosition(this);
		}

		//递归调用得到下一个坐标的上下左右坐标
		function getAround(){

			//上
			this.up = {
				x:position.x,
				y:handleBorderPosition(position.y,-1),
				intPosition:intPosition,
				body:getBoard,
				getDirectionWeight:getDirectionWeight,
				go:go,
				getAround:getAround,
				// flag:1
				flag:2
			};
			//右
			this.right = {
				x:handleBorderPosition(position.x,1),
				y:position.y,
				intPosition:intPosition,
				body:getBoard,
				getDirectionWeight:getDirectionWeight,
				go:go,
				getAround:getAround,
				// flag:2
				flag:3
			};

			//下
			this.bottom = {
				x:position.x,
				y:handleBorderPosition(position.y,1),
				intPosition:intPosition,
				body:getBoard,
				getDirectionWeight:getDirectionWeight,
				go:go,
				getAround:getAround,
				// flag:3
				flag:4
			};

			//左
			this.left = {
				x:handleBorderPosition(position.x,-1),
				intPosition:intPosition,
				body:getBoard,
				y:position.y,
				getDirectionWeight:getDirectionWeight,
				go:go,
				getAround:getAround,
				// flag:4
				flag:1
			};
		}

		//上
		position.up = {
			x:position.x,
			y:handleBorderPosition(position.y,-1),
			intPosition:intPosition,
			body:getBoard,
			getDirectionWeight:getDirectionWeight,
			go:go,
			getAround:getAround,
			// flag:1
			flag:2
		};
		position.up.getDirectionWeight(strength);

		//右
		position.right = {
			x:handleBorderPosition(position.x,1),
			y:position.y,
			intPosition:intPosition,
			body:getBoard,
			getDirectionWeight:getDirectionWeight,
			go:go,
			getAround:getAround,
			// flag:2
			flag:3
		};
		position.right.getDirectionWeight(strength);

		//下
		position.bottom = {
			x:position.x,
			y:handleBorderPosition(position.y,1),
			intPosition:intPosition,
			body:getBoard,
			getDirectionWeight:getDirectionWeight,
			go:go,
			getAround:getAround,
			// flag:3
			flag:4
		};
		position.bottom.getDirectionWeight(strength);

		//左
		position.left = {
			x:handleBorderPosition(position.x,-1),
			intPosition:intPosition,
			body:getBoard,
			y:position.y,
			getDirectionWeight:getDirectionWeight,
			go:go,
			getAround:getAround,
			// flag:4
			flag:1
		};
		position.left.getDirectionWeight(strength);

		return position;
	}

	// var args = process.argv.splice(2);
	// if(args.length < 2 ){
	// 	console.log("参数个数不合法！");
	// 	ready = function(){
	// 		return -1
	// 	}
	// 	run = function(){
	// 		return -1;
	// 	}
	// } else {
	// 	if(args[1] === 'human') {
	// 		console.log("人工模式！");
		
	// 		*
	// 		 * [人工模式运行 直接接受keyDir并返回 左上右下 1234]
	// 		 * @param  {[type]} board    [description]
	// 		 * @param  {[type]} strength [description]
	// 		 * @param  {[type]} keyDir   [description]
	// 		 * @return {[type]}          [description]
			 
	// 		run = function(board,strength,keyDir){
	// 			return keyDir;
	// 		}
	// 	}
	// }

	//暴露方法
	return {
	 	version:version,
	 	ready:ready,
	 	run:run
 	}

}());




//初始化
function ready(no, timeLimit) {
	pacman.ready(no,timeLimit);
}

//动作方法
function run(board,strength) {
    return pacman.run(board,strength);
}



/*简单测试
ready(422,1000);//{x:20,y:2}
var arr=[];
for(var i=0;i<441;i++){
arr.push(-2);
}
arr[50] = -3;//{x:2,y:2}
run(arr,10); 
run(arr,10); 
run(arr,10); 
run(arr,10);  
run(arr,10);  
run(arr,10); 
run(arr,10);  
run(arr,10);  
run(arr,10);  
*/


// computePosition({x:20,y:2});
// function computePosition(position){
// 		//返回坐标对应的整数
// 		var intPosition;
// 		//X轴
// 		var x = position.x;
// 		//Y轴
// 		var y = position.y;
// 		intPosition = 21*x+y;
// console.log(intPosition);
// 		return intPosition;
// 	}

/**
 * @classDescription 贵州都市网自适应超级滚动滚动jQuery插件
 * @author wujinhai (940390@qq.com)
 * @date 2013-08-30
 * @dependence jQuery 1.8.3
 * @DOM
 *  	<div id="marquee">
 *  		<div class="area">
 *  			<ul>
 *   				<li></li>
 *   				<li></li>
 *  			</ul>			
 *  		</div>
 *			<a href="javascript:;" class="prevbtn">前一个</a>
 *			<a href="javascript:;" class="nextbtn">下一个</a>
 *  	</div>
 * @CSS
 *  	#marquee {width:200px;height:50px;overflow:hidden;}
 *  	#marquee li{float:left;display:inline;height:50px;}
 * @Usage
 *  	$('#marquee .area').gzdswSuperScroll({timeout:3000, interval:3000, step:1, direction:'left', goleft:'.prevbtn', goright:'.nextbtn'}); //只有一个控制按钮的情况
 *		$('#marquee .area').gzdswSuperScroll({timeout:3000, interval:3000, step:1, direction:'left', goleft:'children .prevbtn', goright:'children .nextbtn'});  //有多个滚动，每个滚动都有控制按钮
 * @options
 *		timeout:3000,			//等待滚动前的时间，单位为毫秒
 *		interval:3000,			//滚动间隔时间，单位：毫秒
 *      autostart:true,         //是否自动开始滚动
 *		step:1,					//一次滚动多少像素的步长，或者一次滚动几个子元素
 *		direction:'left',		//滚动的方向，可选 left  right  up  down
 *		distance:0,				//一次滚动移动的距离，如果等于0，则按子元素乘以步长滚动
 *      ismarquee:false,        //是否是连续平滑滚动
 *		width:0,				//宽度
 *		height:0,				//高度
 *      goevent:'click',        //操作按钮的方式
 *      goleft:'',            //向左或向上滚动的jq选择器
 *      goright:'',           //向右或向下滚动的jq选择器
 *      speed:'normal',         //默认的滚动速度，只支持自适应和位移滚动
 *		easing:''				//jquery easing 效果，默认无效果，使用 easing 效果，一定要确保加载了 jquery.easing 插件
 */
 
(function($){

	$.fn.gzdswSuperScroll = function(options){
		var opts = $.extend({},$.fn.gzdswSuperScroll.defaults, options);
		
		return this.each(function() {			
			if($(this).attr('inited') == 'true') return true;	//如果已经初始化，则不再继续
			
			var _box = $(this);		//滚动的相对父级元素
			var _moveBox = _box.find('ul');	//被滚动的元素
			var _type = (opts.direction == 'left' || opts.direction == 'right') ? 1 : 0;	//_type滚动的方向，1=水平滚动(scrollLeft)， 0=垂直滚动(scrollTop)
			var _moveType = (opts.direction == 'left' || opts.direction == 'up') ? 1 : -1;	//1 = scrollTop或scrollLeft从0增加， 0 = scrollTop或scrollLeft 从最大值递减
			var _lis = _moveBox.children();	//子元素
			var _li = _lis.first();	//子元素
			var _len = _lis.size();		//滚动子元素的总数
            var _curStep = _moveType == 1 ? 0 : _len;		//初始化当前位置元素索引
			var _timeoutHandle = null;
			var _intervalHandle = null;
			var _scrollMax = 0;
			var _scrollInit = 0;	//滚动子元素的总高宽
            var _param = [];
            var _dir = _type == 1 ? 'scrollLeft' : 'scrollTop';
            var _offsetDir = _type == 1 ? 'offsetLeft' : 'offsetTop';
            var _stop = false;
            var _oldStep = opts.step;
			var _goleft = (typeof opts.goleft != '') ? (opts.goleft.substr(0, 8) == 'children' ? (_box.parent().find(opts.goleft.replace('children ', ''))) : $(opts.goleft)) : null;
			var _goright = (typeof opts.goright != '') ? (opts.goright.substr(0, 8) == 'children' ? (_box.parent().find(opts.goright.replace('children ', ''))) : $(opts.goright)) : null;
            
			if(typeof _li == 'undefined') return true;
			if(_len == 1) return true;	/*只有1个的情况下，不滚动*/		
			
			//初始化滚动对象样式
			_box.css({position:'relative', overflow:'hidden'});
			if(opts.width) _box.width(opts.width);
            if(opts.height) _box.height(opts.height);				
			
            _lis.each(function(){
				_scrollMax += (opts.direction == 'left' || opts.direction == 'right') ? $(this).outerWidth(true) : $(this).outerHeight(true);
			});
            _moveBox.append(_lis.clone());			
			var _clonelis = _moveBox.children();			
			
            if((_type == 1 ? _box.width() : _box.height()) > _scrollMax) return true;
			//将被滚动的元素的高宽设置为所有克隆子元素高宽总和
			if(opts.direction == 'left' || opts.direction == 'right') {
				_moveBox.css({width:_scrollMax*2, overflow:'hidden', display:'block'});
			} else {
				_moveBox.css({height:_scrollMax*2, overflow:'hidden', display:'block'});
			}
            if(opts.distance > 0) {
                opts.step = opts.step > _scrollMax ? _scrollMax : opts.step;    //步进不能超过子元素的长度总和
            } else {
                opts.step = opts.step > _len ? _len : opts.step;    //滚动的元素个数不能超过子元素总数
            }
            
            _scrollInit = _moveType == 1 ? 0 : _clonelis.eq(_len).get(0)[_offsetDir]; //初始的位移;
            _box.get(0)[_dir] = _scrollInit;
            if(opts.distance || opts.ismarquee) _curStep = _moveType == 1 ? 0 : _scrollInit;	
			
			if(opts.autostart) {
                setTimeout(Start, opts.timeout);	//滚动前等待时间
                bindMouseevent();
            }
			_box.attr('inited', 'true');  
            
            if(_goleft != null) {
                if(opts.ismarquee) {
                    //如果是连续滚动，则绑定 over和out
                    _goleft.hover(function(){
                        //over 
                        opts.autostart = true;
                        bindMouseevent();
                        _moveType = 1;
                        opts.step = _oldStep + opts.distance;
                        _scrollInit = _moveType == 1 ? 0 : _clonelis.eq(_len).get(0)[_offsetDir];
                        clearTimeout(_timeoutHandle);
                        clearInterval(_intervalHandle);
                        Start();
                    }, function(){
                        //out
                        opts.step = _oldStep;
                    });
                } else {
                    //绑定向左或向上按钮
                    _goleft.bind(opts.goevent, function(){
                         opts.autostart = true;
                         bindMouseevent();
                         _moveType = 1;
                         _scrollInit = _moveType == 1 ? 0 : _clonelis.eq(_len).get(0)[_offsetDir];
                         clearTimeout(_timeoutHandle);
                         clearInterval(_intervalHandle);
                         scrollFun();
                    });
                }
            }
            if(_goright != null) {
                if(opts.ismarquee) {
                    //如果是连续滚动，则绑定 over和out
                    _goright.hover(function(){
                        //over 
                        opts.autostart = true;
                        bindMouseevent();
                        _moveType = -1;
                        opts.step = _oldStep + opts.distance;
                        _scrollInit = _moveType == 1 ? 0 : _clonelis.eq(_len).get(0)[_offsetDir];
                        clearTimeout(_timeoutHandle);
                        clearInterval(_intervalHandle);
                        Start();
                    }, function(){
                        //out
                        opts.step = _oldStep;
                    });
                } else {
                    //绑定向右或向下按钮
                    _goright.bind(opts.goevent, function(){
                         opts.autostart = true;
                         bindMouseevent();
                         _moveType = -1;
                         _scrollInit = _moveType == 1 ? 0 : _clonelis.eq(_len).get(0)[_offsetDir];
                         clearTimeout(_timeoutHandle);
                         clearInterval(_intervalHandle);
                         scrollFun();
                    });  
                }
            }    
            
            function bindMouseevent() {                
                _moveBox.mouseover(function(){
                    _stop=true;
                    clearTimeout(_timeoutHandle);
                    clearInterval(_intervalHandle);
                });  //鼠标移上暂停
                _moveBox.mouseout(function(){
                    _stop=false;
                    opts.step = _oldStep;
                    Start();
                });     //鼠标移出继续
            }
            
			function Start(){
                if(_stop) return;
				clearTimeout(_timeoutHandle);
				clearInterval(_intervalHandle);
                if(opts.ismarquee) { 
                    //连续滚动
                    _intervalHandle = setInterval(marqueeFun, opts.interval);
                } else {
                    if(opts.distance) {
                        //按位移滚动
                        _timeoutHandle = setTimeout(distanceFun, opts.interval);
                    } else {
                        //按子元素高宽自适应滚动
                        _timeoutHandle = setTimeout(scrollFun, opts.interval);
                    }
				    
                }
			};
            
            
            //连续滚动函数
            function marqueeFun() {
                if(_stop) return;
                var posmax = _clonelis.eq(_moveType ? _len : 0).get(0)[_offsetDir];
                _curStep += _moveType*opts.step;
                if(_curStep < 0) _curStep = 0;
                if(_curStep > posmax) _curStep = posmax;
                //根据方向，如果scrollLeft或scrollTop到了另一个初始位置，则恢复到第一个初始位置
                if(((_moveType == 1) && (_box.get(0)[_dir] >= posmax)) || 
                    ((_moveType == -1) && (_box.get(0)[_dir] <= 0))) {
                    _curStep = _moveType == 1 ? _moveType*opts.step : (posmax - opts.step);
                    _box.get(0)[_dir] = _moveType == 1 ? 0 : (posmax);					
				}
                
                _box.get(0)[_dir] = _curStep;     //下次移动到的位置 
                
            }
            
            
            //位移滚动函数
            function distanceFun() {
                if(_stop) return;
                var posmax = _clonelis.eq(_moveType ? _len : 0).get(0)[_offsetDir];
                _curStep += _moveType*opts.distance;
                if(_curStep < 0) _curStep = 0;
                if(_curStep > posmax) _curStep = posmax;
                //根据方向，如果scrollLeft或scrollTop到了另一个初始位置，则恢复到第一个初始位置
                if(((_moveType == 1) && (_box.get(0)[_dir] >= posmax)) || 
                    ((_moveType == -1) && (_box.get(0)[_dir] <= 0))) {
                    _curStep = _moveType == 1 ? _moveType*opts.distance : (posmax - opts.distance);//-opts.distance;
                    _box.get(0)[_dir] = _moveType == 1 ? 0 : (posmax);					
				}
                
                _param[_dir] = _curStep;     //下次移动到的位置 
                _box.animate(_param, opts.speed, opts.easing, function() {
   					Start();
				});
            }
            
            
            //自适应高宽滚动函数
			function scrollFun() {
                if(_stop) return;
                //根据方向，如果scrollLeft或scrollTop到了另一个初始位置，则恢复到第一个初始位置
                if(((_moveType == 1) && (_box.get(0)[_dir] >= _clonelis.eq(_len).get(0)[_offsetDir])) || 
                    ((_moveType == -1) && (_box.get(0)[_dir] <= _clonelis.eq(0).get(0)[_offsetDir]))) {
                    _box.get(0)[_dir] = _scrollInit;
                    _curStep = _moveType == 1 ? opts.step : (_len-opts.step);					
				} else {
				    _curStep += _moveType*opts.step;
                    if(_curStep < 0) _curStep = 0;
                    if(_curStep > _len) _curStep = _len;
                }
                
                _param[_dir] = _clonelis.eq(_curStep).get(0)[_offsetDir];     //下次移动到的位置 
                _box.animate(_param, opts.speed, opts.easing, function() {
   					Start();
				});
			}
		});
	};
	$.fn.gzdswSuperScroll.defaults = {
		timeout:3000,			/*等待滚动前的时间，单位为毫秒*/
		interval:3000,			/*滚动间隔时间，单位：毫秒*/
        autostart:true,         /*是否自动开始滚动*/
		step:1,					/*一次滚动多少像素的步长，或者一次滚动几个子元素*/
		direction:'left',		/*滚动的方向，可选 left  right  up  down*/
		distance:0,				/*一次滚动移动的距离，如果等于0，则按子元素乘以步长滚动*/
        ismarquee:false,        /*是否是连续平滑滚动*/
		width:0,				/*宽度*/
		height:0,				/*高度*/
        goevent:'click',        /*操作按钮的方式*/
        goleft:'',            /*向左或向上滚动的jq选择器*/
        goright:'',           /*向右或向下滚动的jq选择器*/
        speed:'normal',         /*默认的滚动速度，只支持自适应和位移滚动*/
		easing:''				/*jquery easing 效果，默认无效果，使用 easing 效果，一定要确保加载了 jquery.easing 插件*/
	};
	
	$.fn.gzdswSuperScroll.setDefaults = function(settings) {
		$.extend( $.fn.gzdswSuperScroll.defaults, settings );
	};
	
})(jQuery);